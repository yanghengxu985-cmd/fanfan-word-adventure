"""Create static Mandarin practice clips, preserving existing pilot/English audio.

Reuses the pilot's fixed voice, decoding and loudness pipeline. New files and
manifests live in a separate chinese-lessons directory. Audio is synthetic;
technical verification is not a teacher's pronunciation review.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
from pathlib import Path

import generate_chinese_pilot_audio as pipeline

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/data/chineseLessonsAudioClips.json'
DEST = ROOT / 'public/audio/chinese-lessons'
COMPILED = ROOT / 'src/data/chineseLessonsAudioManifest.json'
PREFIX = 'audio/chinese-lessons/'
pipeline.DEST = DEST
pipeline.CACHE = ROOT / 'output/chinese-lessons-audio-build'
pipeline.PIPELINE_VERSION = 'xiaoxiao-chinese-lessons-v1'


def source_clips() -> dict:
    values = json.loads(SOURCE.read_text(encoding='utf-8'))
    for key, item in values.items():
        if not re.fullmatch(r'cn-(?:\d{2}|garden-\d)-[a-z0-9_-]+', key):
            raise ValueError('Unexpected lesson clip ID: ' + key)
        spoken = item['text'].strip()
        if not 1 <= len(spoken) <= 100 or not re.fullmatch(r'[\u3400-\u9fff，。！？、；：“”‘’（）《》—…\s]+', spoken):
            raise ValueError('Unexpected practice text: ' + key)
        item.update(id=key, spokenText=spoken)
    return values


def verify(source: dict) -> None:
    public = json.loads((DEST / 'manifest.json').read_text(encoding='utf-8'))
    compiled = json.loads(COMPILED.read_text(encoding='utf-8'))
    if compiled != {key: public[key] for key in pipeline.FIELDS} or set(source) != set(public['entries']):
        raise ValueError('Practice manifests and source do not agree')
    checked = set()
    for key, item in source.items():
        entry = public['entries'][key]
        expected = PREFIX + pipeline.asset_key(item['spokenText']) + '.mp3'
        if entry['file'] != expected or any(entry.get(field) != value for field, value in item.items()):
            raise ValueError('Audio text/source mismatch: ' + key)
        if expected not in checked:
            info = pipeline.inspect(ROOT / 'public' / expected)
            if info != public['files'][expected]:
                raise ValueError('Audio integrity mismatch: ' + expected)
            checked.add(expected)
        info = public['files'][expected]
        if entry['bytes'] != info['bytes'] or entry['durationSeconds'] != info['durationSeconds']:
            raise ValueError('Invalid entry metadata: ' + key)
    if checked != set(public['files']) or {p.name for p in DEST.glob('*.mp3')} != {Path(p).name for p in checked}:
        raise ValueError('Missing or unused lesson audio file')
    print(json.dumps({'verifiedClips': len(source), 'uniqueMP3': len(checked), 'bytes': sum(v['bytes'] for v in public['files'].values())}), flush=True)


async def generate(source: dict, concurrency: int) -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    pipeline.CACHE.mkdir(parents=True, exist_ok=True)
    # Reuse previously normalized pilot speech when the words and voice match.
    previous = json.loads((ROOT / 'src/data/chinesePilotAudioManifest.json').read_text(encoding='utf-8'))
    prior_text = {item['spokenText']: item['file'] for item in previous['entries'].values()}
    for item in source.values():
        target = DEST / (pipeline.asset_key(item['spokenText']) + '.mp3')
        if not target.exists() and item['spokenText'] in prior_text:
            shutil.copyfile(ROOT / 'public' / prior_text[item['spokenText']], target)
    semaphore = asyncio.Semaphore(concurrency)
    texts = sorted({item['spokenText'] for item in source.values()})
    metadata = {}

    async def work(text: str) -> None:
        metadata[text] = await pipeline.build(text, semaphore)
        if len(metadata) % 25 == 0 or len(metadata) == len(texts):
            print(f'Lesson audio {len(metadata)}/{len(texts)} ready', flush=True)

    await asyncio.gather(*(work(text) for text in texts))
    entries, files = {}, {}
    for key, item in source.items():
        info = metadata[item['spokenText']]
        filename = PREFIX + pipeline.asset_key(item['spokenText']) + '.mp3'
        entries[key] = {**item, 'file': filename, 'durationSeconds': info['durationSeconds'], 'bytes': info['bytes']}
        files[filename] = info
    manifest = {'schemaVersion': 1, 'voice': pipeline.VOICE, 'rate': pipeline.RATE, 'locale': pipeline.LOCALE,
                'source': 'Microsoft Edge online neural TTS via existing fixed edge-tts pipeline',
                'humanRecorded': False, 'paperTextbookAudio': False,
                'pipelineVersion': pipeline.PIPELINE_VERSION, 'entries': entries, 'files': files}
    (DEST / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    COMPILED.write_text(json.dumps({key: manifest[key] for key in pipeline.FIELDS}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    verify(source)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--concurrency', type=int, default=3)
    arguments = parser.parse_args()
    if not 1 <= arguments.concurrency <= 4:
        parser.error('concurrency must be between 1 and 4')
    values = source_clips()
    if arguments.verify_only:
        verify(values)
    else:
        asyncio.run(generate(values, arguments.concurrency))
