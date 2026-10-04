"""Build the approved Sonia/-12% English recordings; never publishes the app.

Use --verify-only to inspect the committed files without contacting the service.
The online synthesis step uses Microsoft Edge's neural TTS through edge-tts,
not an Azure Speech API subscription or a human/textbook recording.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import math
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
from mutagen.mp3 import MP3


ROOT = Path(__file__).resolve().parents[1]
VOICE = "en-GB-SoniaNeural"
RATE = "-12%"
LOCALE = "en-GB"
SAMPLE_RATE = 24000
PIPELINE_VERSION = "sonia-slow-normalized-v1"
DEST = ROOT / "public" / "audio" / "english"
COMPILED_MANIFEST = ROOT / "src" / "data" / "englishAudioManifest.json"
CACHE = ROOT / "output" / "english-audio-build"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def json_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def asset_key(spoken_text: str) -> str:
    """The audible input, voice, rate and processing version determine the file."""
    return hashlib.sha256(json_bytes([VOICE, RATE, spoken_text, PIPELINE_VERSION])).hexdigest()[:24]


def spoken_text(item: dict) -> str:
    text = item["text"].strip()
    if item["kind"] == "alphabet":
        if len(text) != 2 or text[0].lower() != text[1] or not text[0].isascii():
            raise ValueError("Unexpected alphabet pair: " + text)
        # Send the single uppercase letter, never both cases. Explicit British
        # zed and double you avoid locale/abbreviation ambiguity.
        return {"W": "double you", "Z": "zed"}.get(text[0], text[0])
    if text == "Mr":
        return "Mister"
    # Do not send Chinese/source annotations, alternatives or textbook stars.
    if any(ord(ch) > 127 for ch in text) or any(ch in text for ch in "()*[]"):
        raise ValueError("Unreviewed speech annotation in " + item["id"])
    if not text or len(text) > 90:
        raise ValueError("Unexpected speech input in " + item["id"])
    return text


def inventory() -> list[dict]:
    data = json.loads((ROOT / "src" / "data" / "inventory.json").read_text(encoding="utf-8"))
    items = [item for item in data["lexemes"] if item["subject"] == "english"]
    if len(items) != 153 or sum(item["kind"] == "alphabet" for item in items) != 26:
        raise ValueError("Inventory changed: review the English coverage before rebuilding.")
    if len({item["id"] for item in items}) != len(items):
        raise ValueError("Duplicate English lexeme ID")
    if not all(item["readingVerified"] for item in items):
        raise ValueError("An English reading still requires editorial review")
    for item in items:
        spoken_text(item)
    return items


def decode(path: Path) -> bytes:
    return subprocess.run(
        [FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(path),
         "-f", "s16le", "-acodec", "pcm_s16le", "-ar", str(SAMPLE_RATE), "-ac", "1", "-"],
        capture_output=True, check=True, timeout=30,
    ).stdout


def inspect(path: Path, *, normalized: bool = True) -> dict:
    """Check full decoding, sane duration, samples and audible levels."""
    audio = MP3(path)
    raw = decode(path)
    if not raw or len(raw) % 2:
        raise ValueError("Invalid decoded PCM: " + path.name)
    values = struct.unpack("<" + "h" * (len(raw) // 2), raw)
    peak = max(abs(value) for value in values) / 32768
    rms = math.sqrt(sum(value * value for value in values) / len(values)) / 32768
    if not .25 < audio.info.length < 12 or audio.info.sample_rate != SAMPLE_RATE:
        raise ValueError("Unexpected audio duration/sample rate: " + path.name)
    if path.stat().st_size < 1000 or not .015 < peak < .99 or rms < .003:
        raise ValueError("Silent, clipped or very quiet audio: " + path.name)
    if normalized and (peak > .9 or rms < .006):
        raise ValueError("Unexpected normalized audio level: " + path.name)
    return {
        "durationSeconds": round(audio.info.length, 3),
        "bytes": path.stat().st_size,
        "sampleRate": audio.info.sample_rate,
        "peakDBFS": round(20 * math.log10(peak), 2),
        "rmsDBFS": round(20 * math.log10(rms), 2),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def existing_raw_sample(spoken: str) -> Path:
    # The audition tool used default JSON separators and text/voice/rate order.
    key = hashlib.sha256(json.dumps([spoken, VOICE, RATE]).encode("utf-8")).hexdigest()[:18]
    return ROOT / "output" / "english-audio-samples" / "clips" / (key + ".mp3")


def normalize(raw_path: Path, target: Path) -> None:
    pcm = decode(raw_path)
    values = struct.unpack("<" + "h" * (len(pcm) // 2), pcm)
    # Conservative -54 dBFS activity threshold keeps quiet consonants. Retain
    # 150 ms before and 250 ms after detected speech, rather than hard gating.
    active = [i for i, value in enumerate(values) if abs(value) >= 64]
    if not active:
        raise ValueError("No speech activity in " + raw_path.name)
    first = max(0, active[0] - int(.15 * SAMPLE_RATE))
    last = min(len(values), active[-1] + 1 + int(.25 * SAMPLE_RATE))
    wav_path = CACHE / (target.stem + ".wav")
    with wave.open(str(wav_path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(SAMPLE_RATE)
        stream.writeframes(pcm[first * 2:last * 2])
    temporary = target.with_suffix(".building.mp3")
    subprocess.run(
        [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav_path),
         "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", str(SAMPLE_RATE), "-ac", "1",
         "-codec:a", "libmp3lame", "-b:a", "128k", str(temporary)],
        capture_output=True, check=True, timeout=30,
    )
    inspect(temporary)
    temporary.replace(target)


async def build_file(spoken: str, limiter: asyncio.Semaphore) -> dict:
    key = asset_key(spoken)
    target = DEST / (key + ".mp3")
    if target.exists():
        return inspect(target)
    async with limiter:
        raw_path = CACHE / (key + ".source.mp3")
        if not raw_path.exists():
            sample = existing_raw_sample(spoken)
            if sample.exists():
                inspect(sample, normalized=False)
                shutil.copyfile(sample, raw_path)
        if raw_path.exists():
            inspect(raw_path, normalized=False)
        else:
            # Bound concurrent requests and retry count. Finish the raw file
            # atomically so an interrupted download cannot masquerade as cache.
            temporary = raw_path.with_suffix(".downloading.mp3")
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(spoken, VOICE, rate=RATE).save(str(temporary))
                    inspect(temporary, normalized=False)
                    temporary.replace(raw_path)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 * (attempt + 1))
            await asyncio.sleep(.2)
        normalize(raw_path, target)
        return inspect(target)


def manifest_for(items: list[dict], metadata: dict[str, dict]) -> dict:
    entries = {}
    files = {}
    for item in items:
        spoken = spoken_text(item)
        file = "audio/english/" + asset_key(spoken) + ".mp3"
        info = metadata[spoken]
        entries[item["id"]] = {
            "file": file, "text": item["text"], "spokenText": spoken,
            "durationSeconds": info["durationSeconds"], "bytes": info["bytes"],
        }
        files[file] = info
    return {
        "schemaVersion": 1,
        "voice": VOICE,
        "rate": RATE,
        "locale": LOCALE,
        "source": "Microsoft Edge online neural TTS via edge-tts 7.2.8",
        "humanRecorded": False,
        "paperTextbookAudio": False,
        "pipelineVersion": PIPELINE_VERSION,
        "normalization": {"targetLUFS": -18, "truePeakLimitDB": -2, "sampleRate": SAMPLE_RATE},
        "entries": entries,
        "files": files,
    }


def write_manifests(manifest: dict) -> None:
    temporary = DEST / "manifest.building.json"
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(DEST / "manifest.json")
    compiled = {field: manifest[field] for field in ("schemaVersion", "voice", "rate", "locale", "entries")}
    temporary_compiled = COMPILED_MANIFEST.with_suffix(".building.json")
    temporary_compiled.write_text(json.dumps(compiled, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_compiled.replace(COMPILED_MANIFEST)


def verify(items: list[dict]) -> None:
    manifest = json.loads((DEST / "manifest.json").read_text(encoding="utf-8"))
    compiled = json.loads(COMPILED_MANIFEST.read_text(encoding="utf-8"))
    compiled_fields = ("schemaVersion", "voice", "rate", "locale", "entries")
    if compiled != {field: manifest[field] for field in compiled_fields}:
        raise ValueError("Compiled and public audio manifests disagree")
    if (manifest["schemaVersion"], manifest["voice"], manifest["rate"], manifest["locale"]) != (1, VOICE, RATE, LOCALE):
        raise ValueError("Wrong voice/rate/locale manifest")
    if set(manifest["entries"]) != {item["id"] for item in items}:
        raise ValueError("Manifest does not cover the current English inventory exactly")
    checked = set()
    for item in items:
        entry = manifest["entries"][item["id"]]
        spoken = spoken_text(item)
        file = "audio/english/" + asset_key(spoken) + ".mp3"
        if (entry["text"], entry["spokenText"], entry["file"]) != (item["text"], spoken, file):
            raise ValueError("Mismatched manifest entry: " + item["id"])
        if file not in checked:
            actual = inspect(ROOT / "public" / file)
            if actual != manifest["files"][file]:
                raise ValueError("Audio file changed since manifest generation: " + file)
            checked.add(file)
        if entry["durationSeconds"] != manifest["files"][file]["durationSeconds"] or entry["bytes"] != manifest["files"][file]["bytes"]:
            raise ValueError("Entry audio metadata mismatch: " + item["id"])
    if set(manifest["files"]) != checked or {path.name for path in DEST.glob("*.mp3")} != {Path(file).name for file in checked}:
        raise ValueError("Unreferenced or missing MP3 asset")
    print(f"Verified {len(items)} entries / {len(checked)} unique MP3 assets", flush=True)


async def generate(items: list[dict], concurrency: int) -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    inputs = sorted({spoken_text(item) for item in items})
    keys = [asset_key(spoken) for spoken in inputs]
    if len(set(keys)) != len(keys):
        raise ValueError("Asset hash collision")
    metadata = {}
    limiter = asyncio.Semaphore(concurrency)

    async def work(spoken: str) -> None:
        metadata[spoken] = await build_file(spoken, limiter)
        if len(metadata) % 10 == 0 or len(metadata) == len(inputs):
            print(f"Audio {len(metadata)}/{len(inputs)} ready", flush=True)

    await asyncio.gather(*(work(spoken) for spoken in inputs))
    write_manifests(manifest_for(items, metadata))
    verify(items)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true", help="Decode/check all MP3s; no network synthesis")
    parser.add_argument("--concurrency", type=int, default=3, choices=(1, 2, 3))
    args = parser.parse_args()
    items = inventory()
    if args.verify_only:
        verify(items)
    else:
        asyncio.run(generate(items, args.concurrency))


if __name__ == "__main__":
    main()
