"""Build isolated Mandarin recordings for the two-lesson Chinese pilot.

Only reviewed words and public-domain poem lines in chinesePilotClips.json are
read. The game plays the resulting static MP3; it never calls online TTS.
Use --verify-only to check the committed assets without network access.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import math
import re
import struct
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
from mutagen.mp3 import MP3


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "data" / "chinesePilotClips.json"
DEST = ROOT / "public" / "audio" / "chinese-pilot"
COMPILED = ROOT / "src" / "data" / "chinesePilotAudioManifest.json"
CACHE = ROOT / "output" / "chinese-pilot-audio-build"
VOICE, RATE, LOCALE = "zh-CN-XiaoxiaoNeural", "-8%", "zh-CN"
SAMPLE_RATE = 24000
PIPELINE_VERSION = "xiaoxiao-mandarin-pilot-v1"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FIELDS = ("schemaVersion", "voice", "rate", "locale", "source", "entries")


def json_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def clips() -> dict[str, dict]:
    source = json.loads(SOURCE.read_text(encoding="utf-8"))
    if not isinstance(source, dict) or not source:
        raise ValueError("Expected a nonempty reviewed Chinese clip map")
    result = {}
    for clip_id, value in source.items():
        if not re.fullmatch(r"cn-?(?:01|04)-[a-z0-9-]+", clip_id):
            raise ValueError("Audio may only cover the two reviewed pilot lessons: " + clip_id)
        item = {"text": value} if isinstance(value, str) else dict(value)
        text = item.get("text", "")
        spoken = item.get("spokenText", text).strip()
        if not text or not spoken or len(spoken) > 50:
            raise ValueError("Unexpected Chinese clip length: " + clip_id)
        if not re.fullmatch(r"[\u3400-\u9fff，。！？、；：\s]+", spoken):
            raise ValueError("Speech must contain reviewed Chinese, not labels or pinyin: " + clip_id)
        item.update(id=clip_id, spokenText=spoken)
        result[clip_id] = item
    return result


def asset_key(spoken: str) -> str:
    return hashlib.sha256(json_bytes([VOICE, RATE, spoken, PIPELINE_VERSION])).hexdigest()[:24]


def decode(path: Path) -> bytes:
    return subprocess.run(
        [FFMPEG, "-hide_banner", "-loglevel", "error", "-i", str(path),
         "-f", "s16le", "-acodec", "pcm_s16le", "-ar", str(SAMPLE_RATE), "-ac", "1", "-"],
        capture_output=True, check=True, timeout=30,
    ).stdout


def inspect(path: Path, *, normalized: bool = True) -> dict:
    audio = MP3(path)
    pcm = decode(path)
    if not pcm or len(pcm) % 2:
        raise ValueError("Invalid decoded Mandarin PCM: " + path.name)
    values = struct.unpack("<" + "h" * (len(pcm) // 2), pcm)
    peak = max(abs(value) for value in values) / 32768
    rms = math.sqrt(sum(value * value for value in values) / len(values)) / 32768
    if not .25 < audio.info.length < 20 or audio.info.sample_rate != SAMPLE_RATE:
        raise ValueError("Unexpected Mandarin duration or sample rate: " + path.name)
    if path.stat().st_size < 1000 or not .015 < peak < .99 or rms < .003:
        raise ValueError("Silent, clipped or very quiet Mandarin audio: " + path.name)
    if normalized and (peak > .9 or rms < .006):
        raise ValueError("Unexpected normalized Mandarin level: " + path.name)
    return {
        "durationSeconds": round(audio.info.length, 3), "bytes": path.stat().st_size,
        "sampleRate": audio.info.sample_rate,
        "peakDBFS": round(20 * math.log10(peak), 2),
        "rmsDBFS": round(20 * math.log10(rms), 2),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def normalize(source: Path, target: Path) -> None:
    pcm = decode(source)
    values = struct.unpack("<" + "h" * (len(pcm) // 2), pcm)
    active = [index for index, value in enumerate(values) if abs(value) >= 64]
    if not active:
        raise ValueError("No speech found: " + source.name)
    first = max(0, active[0] - int(.15 * SAMPLE_RATE))
    last = min(len(values), active[-1] + 1 + int(.25 * SAMPLE_RATE))
    wav = CACHE / (target.stem + ".wav")
    with wave.open(str(wav), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(SAMPLE_RATE)
        stream.writeframes(pcm[first * 2:last * 2])
    temporary = target.with_suffix(".building.mp3")
    subprocess.run(
        [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
         "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", str(SAMPLE_RATE), "-ac", "1",
         "-codec:a", "libmp3lame", "-b:a", "128k", str(temporary)],
        capture_output=True, check=True, timeout=30,
    )
    inspect(temporary)
    temporary.replace(target)


async def build(spoken: str, semaphore: asyncio.Semaphore) -> dict:
    key = asset_key(spoken)
    target = DEST / (key + ".mp3")
    if target.exists():
        return inspect(target)
    async with semaphore:
        raw = CACHE / (key + ".source.mp3")
        if raw.exists():
            inspect(raw, normalized=False)
        else:
            temporary = raw.with_suffix(".downloading.mp3")
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(spoken, VOICE, rate=RATE).save(str(temporary))
                    inspect(temporary, normalized=False)
                    temporary.replace(raw)
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 * (attempt + 1))
            await asyncio.sleep(.2)
        normalize(raw, target)
        return inspect(target)


def write_manifests(source: dict[str, dict], metadata: dict[str, dict]) -> None:
    entries, files = {}, {}
    for clip_id, item in source.items():
        spoken = item["spokenText"]
        file = "audio/chinese-pilot/" + asset_key(spoken) + ".mp3"
        info = metadata[spoken]
        entries[clip_id] = {
            **item, "file": file, "durationSeconds": info["durationSeconds"],
            "bytes": info["bytes"],
        }
        files[file] = info
    manifest = {
        "schemaVersion": 1, "voice": VOICE, "rate": RATE, "locale": LOCALE,
        "source": "Microsoft Edge online neural TTS via edge-tts 7.2.8",
        "humanRecorded": False, "paperTextbookAudio": False,
        "pipelineVersion": PIPELINE_VERSION,
        "normalization": {"targetLUFS": -18, "truePeakLimitDB": -2, "sampleRate": SAMPLE_RATE},
        "entries": entries, "files": files,
    }
    temporary = DEST / "manifest.building.json"
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    temporary.replace(DEST / "manifest.json")
    temporary = COMPILED.with_suffix(".building.json")
    temporary.write_text(json.dumps({key: manifest[key] for key in FIELDS}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    temporary.replace(COMPILED)


def verify(source: dict[str, dict]) -> None:
    manifest = json.loads((DEST / "manifest.json").read_text(encoding="utf-8"))
    compiled = json.loads(COMPILED.read_text(encoding="utf-8"))
    if compiled != {key: manifest[key] for key in FIELDS}:
        raise ValueError("Public and compiled Mandarin manifests disagree")
    if (manifest["schemaVersion"], manifest["voice"], manifest["rate"], manifest["locale"]) != (1, VOICE, RATE, LOCALE):
        raise ValueError("Unexpected Mandarin voice/rate/locale/schema")
    if set(manifest["entries"]) != set(source):
        raise ValueError("Mandarin manifest/source ID coverage mismatch")
    checked = set()
    for clip_id, item in source.items():
        spoken = item["spokenText"]
        file = "audio/chinese-pilot/" + asset_key(spoken) + ".mp3"
        entry = manifest["entries"][clip_id]
        if any(entry.get(key) != value for key, value in item.items()) or entry["file"] != file:
            raise ValueError("Mandarin clip text/source metadata mismatch: " + clip_id)
        if file not in checked:
            actual = inspect(ROOT / "public" / file)
            if actual != manifest["files"][file]:
                raise ValueError("Mandarin MP3 integrity mismatch: " + file)
            checked.add(file)
        if entry["bytes"] != manifest["files"][file]["bytes"] or entry["durationSeconds"] != manifest["files"][file]["durationSeconds"]:
            raise ValueError("Mandarin entry duration/bytes mismatch: " + clip_id)
    if set(manifest["files"]) != checked or {path.name for path in DEST.glob("*.mp3")} != {Path(file).name for file in checked}:
        raise ValueError("Missing or unreferenced Mandarin MP3")
    print(json.dumps({"verifiedClips": len(source), "uniqueMP3": len(checked), "bytes": sum(item["bytes"] for item in manifest["files"].values()), "durationSeconds": round(sum(item["durationSeconds"] for item in manifest["files"].values()), 3)}, ensure_ascii=False), flush=True)


async def generate(source: dict[str, dict], concurrency: int) -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    inputs = sorted({item["spokenText"] for item in source.values()})
    if len({asset_key(text) for text in inputs}) != len(inputs):
        raise ValueError("Mandarin asset hash collision")
    metadata = {}
    semaphore = asyncio.Semaphore(concurrency)

    async def work(text: str) -> None:
        metadata[text] = await build(text, semaphore)
        if len(metadata) % 10 == 0 or len(metadata) == len(inputs):
            print(f"Mandarin pilot audio {len(metadata)}/{len(inputs)} ready", flush=True)

    await asyncio.gather(*(work(text) for text in inputs))
    write_manifests(source, metadata)
    verify(source)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true", help="Decode and hash-check existing files; no online TTS")
    parser.add_argument("--concurrency", type=int, default=3)
    args = parser.parse_args()
    source = clips()
    if args.verify_only:
        verify(source)
    elif 1 <= args.concurrency <= 4:
        asyncio.run(generate(source, args.concurrency))
    else:
        parser.error("--concurrency must be between 1 and 4")


if __name__ == "__main__":
    main()
