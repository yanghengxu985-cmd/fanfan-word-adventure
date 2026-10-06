"""Build the three licensed cn-07 reference recordings as small local MP3s.

Requires scripts/requirements-audio.txt. Sources are cached under ignored output/.
The original recordings are kept intact: no pitch, speed or synthetic sound changes.
Run --verify-only to inspect committed audio without downloading or rewriting it.
"""
from __future__ import annotations

import argparse
from array import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import urllib.request

import imageio_ffmpeg
from mutagen.mp3 import MP3

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "output" / "audio-sources"
DEST = ROOT / "public" / "audio" / "nature"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SAMPLE_RATE = 44100
SOURCES = (
    ("leaves", "cn07-leaves-mjeno-405136-source.mp3", "autumn-leaves.mp3",
     "https://cdn.freesound.org/previews/405/405136_3958938-hq.mp3"),
    ("cricket", "cn07-cricket-brandon-morris-source.ogg", "field-cricket.mp3",
     "https://opengameart.org/sites/default/files/cricket%20ambienc276.ogg"),
    ("geese", "cn07-geese-jens-loose-518305-source.mp3", "greylag-flight-calls.mp3",
     "https://xeno-canto.org/518305/download"),
)


def inspect(path: Path) -> dict:
    pcm = subprocess.run(
        [FFMPEG, "-v", "error", "-i", str(path), "-f", "f32le", "-ar", str(SAMPLE_RATE),
         "-ac", "1", "-"], capture_output=True, check=True, timeout=30).stdout
    samples = array("f", pcm)
    if not samples:
        raise ValueError("Empty recording: " + path.name)
    return {
        "duration": round(len(samples) / SAMPLE_RATE, 5),
        "bytes": path.stat().st_size,
        "peak": round(max(abs(value) for value in samples), 6),
        "rms": round(math.sqrt(sum(value * value for value in samples) / len(samples)), 6),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    DEST.mkdir(parents=True, exist_ok=True)
    entries = []
    for layer, cache_name, destination, url in SOURCES:
        original, target = CACHE / cache_name, DEST / destination
        if not args.verify_only:
            if not original.is_file():
                request = urllib.request.Request(url, headers={"User-Agent": "FanfanNatureAudio/1.0"})
                with urllib.request.urlopen(request, timeout=30) as response:
                    original.write_bytes(response.read())
            original_stats = inspect(original)
            if not 8 < original_stats["duration"] < 16 or original_stats["rms"] < .001:
                raise ValueError("Unexpected source recording: " + cache_name)
            # Loudness normalisation contains leaf transients while making quiet rustles audible.
            # A peak-only gain would leave the leaves about 20 dB quieter than the animal calls.
            fade_out_at = original_stats["duration"] - .025
            normalized = CACHE / (layer + "-normalized.wav")
            subprocess.run(
                [FFMPEG, "-y", "-v", "error", "-i", str(original), "-vn", "-ac", "1",
                 "-ar", str(SAMPLE_RATE), "-af", "loudnorm=I=-18:TP=-3:LRA=7",
                 "-codec:a", "pcm_f32le", str(normalized)], check=True, timeout=30)
            normalized_stats = inspect(normalized)
            level = min(.08 / normalized_stats["rms"], .78 / normalized_stats["peak"])
            filters = f"volume={level:.8f},afade=t=in:d=0.025,afade=t=out:st={fade_out_at:.5f}:d=0.025"
            subprocess.run(
                [FFMPEG, "-y", "-v", "error", "-i", str(normalized), "-map_metadata", "-1",
                 "-vn", "-ac", "1", "-ar", str(SAMPLE_RATE), "-af", filters,
                 "-codec:a", "libmp3lame", "-q:a", "4", str(target)], check=True, timeout=30)
        stats = inspect(target)
        info = MP3(target).info
        if not 8 < stats["duration"] < 16 or not .04 < stats["peak"] < .95 or stats["rms"] < .03:
            raise ValueError("Silent, clipped or unexpected output: " + destination + " " + json.dumps(stats))
        if info.sample_rate != SAMPLE_RATE or info.channels != 1 or stats["bytes"] > 220000:
            raise ValueError("Unexpected output format or file size: " + destination)
        entries.append({"id": layer, "source": "audio/nature/" + destination,
                        "sampleRate": info.sample_rate, "channels": info.channels, **stats})
    report = {"lesson": "cn-07", "pipeline": "field-recordings-mono-mp3-v1",
              "checks": "Source identity/licence checked; complete natural timing retained; decoded PCM checked for silence/clipping.",
              "listeningLimit": "Automated checks are not an auditory review. Naturalness remains subject to user listening.",
              "totalBytes": sum(entry["bytes"] for entry in entries), "entries": entries}
    report_path = ROOT / "docs" / "AUTUMN_NATURE_AUDIO_VERIFICATION.json"
    if args.verify_only:
        expected = json.loads(report_path.read_text(encoding="utf-8"))
        if entries != expected["entries"]:
            raise ValueError("Committed audio differs from its verification report")
    else:
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"totalBytes": report["totalBytes"], "entries": entries}, ensure_ascii=False))


if __name__ == "__main__":
    main()
