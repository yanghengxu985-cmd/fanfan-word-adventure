"""Build separate Sonia/-12% recordings for English activities.

Source: src/data/englishActivityClips.json, an ID -> English text map.
Never edits vocabulary recordings, publishes files or calls TTS at app runtime.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import math
import re
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

import edge_tts
from mutagen.mp3 import MP3

import generate_english_audio as shared


ROOT = Path(__file__).resolve().parents[1]
VOICE, RATE, LOCALE = "en-GB-SoniaNeural", "-12%", "en-GB"
SAMPLE_RATE = 24000
PIPELINE_VERSION = "sonia-slow-activity-v1"
SOURCE = ROOT / "src" / "data" / "englishActivityClips.json"
DEST = ROOT / "public" / "audio" / "english-activities"
COMPILED = ROOT / "src" / "data" / "englishActivityAudioManifest.json"
CACHE = ROOT / "output" / "english-activity-audio-build"
FIELDS = ("schemaVersion", "voice", "rate", "locale", "entries")


def speech_text(text: str) -> str:
    spoken = text.strip().replace("\u2019", "'")
    spoken = re.sub(r"\bMr\.?\b\.?", "Mister", spoken)
    if not spoken or len(spoken) > 600 or any(ord(char) > 127 for char in spoken):
        raise ValueError("Unexpected activity speech text: " + repr(text))
    if any(char in spoken for char in "()*[]{}"):
        raise ValueError("Activity speech may not include annotations: " + repr(text))
    if re.search(r"(?:^|\n)\s*[A-Za-z ]{1,30}:", spoken):
        raise ValueError("Remove role labels from activity speech: " + repr(text))
    return spoken


def source_clips() -> dict[str, str]:
    clips = json.loads(SOURCE.read_text(encoding="utf-8"))
    if not isinstance(clips, dict) or not clips:
        raise ValueError("Expected a nonempty activity ID -> text map")
    for clip_id, text in clips.items():
        if not isinstance(clip_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]+", clip_id):
            raise ValueError("Invalid activity clip ID")
        if not isinstance(text, str):
            raise ValueError("Activity clip text must be a string: " + clip_id)
        speech_text(text)
    return clips


def asset_key(spoken: str) -> str:
    return hashlib.sha256(shared.json_bytes([VOICE, RATE, spoken, PIPELINE_VERSION])).hexdigest()[:24]


def inspect(path: Path, *, normalized: bool = True) -> dict:
    audio = MP3(path)
    pcm = shared.decode(path)
    if not pcm or len(pcm) % 2:
        raise ValueError("Invalid activity audio PCM: " + path.name)
    values = struct.unpack("<" + "h" * (len(pcm) // 2), pcm)
    peak = max(abs(value) for value in values) / 32768
    rms = math.sqrt(sum(value * value for value in values) / len(values)) / 32768
    if not .25 < audio.info.length < 60 or audio.info.sample_rate != SAMPLE_RATE:
        raise ValueError("Unexpected activity duration/sample rate: " + path.name)
    if path.stat().st_size < 1000 or not .015 < peak < .99 or rms < .003:
        raise ValueError("Silent/clipped/very quiet activity audio: " + path.name)
    if normalized and (peak > .9 or rms < .006):
        raise ValueError("Unexpected normalized activity level: " + path.name)
    return {
        "durationSeconds": round(audio.info.length, 3), "bytes": path.stat().st_size,
        "sampleRate": audio.info.sample_rate,
        "peakDBFS": round(20 * math.log10(peak), 2),
        "rmsDBFS": round(20 * math.log10(rms), 2),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def normalize(source: Path, target: Path) -> None:
    pcm = shared.decode(source)
    values = struct.unpack("<" + "h" * (len(pcm) // 2), pcm)
    active = [index for index, value in enumerate(values) if abs(value) >= 64]
    if not active:
        raise ValueError("No speech activity: " + source.name)
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
        [shared.FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
         "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", str(SAMPLE_RATE), "-ac", "1",
         "-codec:a", "libmp3lame", "-b:a", "128k", str(temporary)],
        capture_output=True, check=True, timeout=30,
    )
    inspect(temporary)
    temporary.replace(target)


def reusable_word_files() -> dict[str, Path]:
    manifest = json.loads((ROOT / "public" / "audio" / "english" / "manifest.json").read_text(encoding="utf-8"))
    if (manifest["voice"], manifest["rate"], manifest["locale"]) != (VOICE, RATE, LOCALE):
        return {}
    reusable = {}
    for item in manifest["entries"].values():
        file = ROOT / "public" / item["file"]
        if file.exists() and hashlib.sha256(file.read_bytes()).hexdigest() == manifest["files"][item["file"]]["sha256"]:
            reusable[item["spokenText"]] = file
    return reusable


async def build(spoken: str, limit: asyncio.Semaphore, words: dict[str, Path]) -> dict:
    key = asset_key(spoken)
    target = DEST / (key + ".mp3")
    if target.exists():
        return inspect(target)
    async with limit:
        if spoken in words:
            shutil.copyfile(words[spoken], target)
            return inspect(target)
        raw = CACHE / (key + ".source.mp3")
        if not raw.exists():
            audition = shared.existing_raw_sample(spoken)
            word_source = ROOT / "output" / "english-audio-build" / (shared.asset_key(spoken) + ".source.mp3")
            candidate = audition if audition.exists() else word_source
            if candidate.exists():
                inspect(candidate, normalized=False)
                shutil.copyfile(candidate, raw)
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


def write_manifests(clips: dict[str, str], metadata: dict[str, dict]) -> None:
    entries, files = {}, {}
    for clip_id, text in clips.items():
        spoken = speech_text(text)
        file = "audio/english-activities/" + asset_key(spoken) + ".mp3"
        info = metadata[spoken]
        entries[clip_id] = {
            "id": clip_id, "file": file, "text": text, "spokenText": spoken,
            "durationSeconds": info["durationSeconds"], "bytes": info["bytes"],
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
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(DEST / "manifest.json")
    temporary = COMPILED.with_suffix(".building.json")
    temporary.write_text(json.dumps({key: manifest[key] for key in FIELDS}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(COMPILED)


def verify(clips: dict[str, str]) -> None:
    manifest = json.loads((DEST / "manifest.json").read_text(encoding="utf-8"))
    compiled = json.loads(COMPILED.read_text(encoding="utf-8"))
    if compiled != {key: manifest[key] for key in FIELDS}:
        raise ValueError("Public and compiled activity manifests disagree")
    if (manifest["schemaVersion"], manifest["voice"], manifest["rate"], manifest["locale"]) != (1, VOICE, RATE, LOCALE):
        raise ValueError("Wrong activity schema/voice/rate/locale")
    if set(manifest["entries"]) != set(clips):
        raise ValueError("Activity manifest/source ID coverage mismatch")
    checked = set()
    for clip_id, text in clips.items():
        entry = manifest["entries"][clip_id]
        spoken = speech_text(text)
        file = "audio/english-activities/" + asset_key(spoken) + ".mp3"
        if (entry["id"], entry["text"], entry["spokenText"], entry["file"]) != (clip_id, text, spoken, file):
            raise ValueError("Mismatched activity clip: " + clip_id)
        if file not in checked:
            actual = inspect(ROOT / "public" / file)
            if actual != manifest["files"][file]:
                raise ValueError("Activity file integrity mismatch: " + file)
            checked.add(file)
        if entry["bytes"] != manifest["files"][file]["bytes"] or entry["durationSeconds"] != manifest["files"][file]["durationSeconds"]:
            raise ValueError("Activity entry metadata mismatch: " + clip_id)
    if set(manifest["files"]) != checked or {path.name for path in DEST.glob("*.mp3")} != {Path(file).name for file in checked}:
        raise ValueError("Missing or unreferenced activity MP3")
    print(f"Verified {len(clips)} activity clips / {len(checked)} unique MP3 assets", flush=True)


async def generate(clips: dict[str, str], concurrency: int) -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    CACHE.mkdir(parents=True, exist_ok=True)
    inputs = sorted({speech_text(text) for text in clips.values()})
    if len({asset_key(spoken) for spoken in inputs}) != len(inputs):
        raise ValueError("Activity asset hash collision")
    metadata = {}
    limit = asyncio.Semaphore(concurrency)
    words = reusable_word_files()

    async def work(spoken: str) -> None:
        metadata[spoken] = await build(spoken, limit, words)
        if len(metadata) % 10 == 0 or len(metadata) == len(inputs):
            print(f"Activity audio {len(metadata)}/{len(inputs)} ready", flush=True)

    await asyncio.gather(*(work(spoken) for spoken in inputs))
    write_manifests(clips, metadata)
    verify(clips)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify-only", action="store_true")
    parser.add_argument("--concurrency", type=int, default=3, choices=(1, 2, 3))
    args = parser.parse_args()
    clips = source_clips()
    if args.verify_only:
        verify(clips)
    else:
        asyncio.run(generate(clips, args.concurrency))


if __name__ == "__main__":
    main()
