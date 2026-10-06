import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { autumnNatureRecordings, getLessonNatureRecordings } from './chineseNatureSounds';
import { getChinesePrecisionLesson } from './chineseLessonPrecision';

test('autumn layers resolve to three distinct local recordings with accessible attribution', () => {
  const tool = getChinesePrecisionLesson('cn-07')!.tools[0];
  assert.equal(tool.kind, 'sound');
  if (tool.kind !== 'sound') throw new Error('Missing autumn sound tool');
  assert.deepEqual(tool.layers.map(layer => layer.id), ['leaves', 'cricket', 'geese']);
  assert.deepEqual(tool.layers.map(layer => layer.recording), getLessonNatureRecordings('cn-07'));
  assert.equal(new Set(tool.layers.map(layer => layer.recording!.source)).size, 3);
  for (const recording of Object.values(autumnNatureRecordings)) {
    assert.match(recording.source, /^audio\/nature\/[a-z-]+\.mp3$/);
    assert.match(recording.sourceUrl, /^https:\/\//);
    assert.match(recording.licenseUrl, /^https:\/\/creativecommons.org\//);
    assert.ok(recording.author && recording.description && recording.changes);
  }
  assert.match(autumnNatureRecordings.geese.title, /Anser anser/);
  assert.match(autumnNatureRecordings.geese.description, /飞行鸣叫/);
  assert.equal(autumnNatureRecordings.geese.license, 'CC BY-SA 4.0');
  assert.match(tool.simulationNote, /真实录音/);
  assert.match(tool.teacherHint, /诗人的想象/);
  assert.deepEqual(getLessonNatureRecordings('cn-21'), []);
});

test('committed MP3s match decoded-audio verification and stay small enough for first playback', () => {
  const report = JSON.parse(readFileSync(new URL('../../docs/AUTUMN_NATURE_AUDIO_VERIFICATION.json', import.meta.url), 'utf8'));
  let totalBytes = 0;
  const hashes = new Set<string>();
  for (const entry of report.entries) {
    const bytes = readFileSync(new URL('../../public/' + entry.source, import.meta.url));
    assert.equal(bytes.length, entry.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256);
    assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224), 'Expected an MP3, not a failed HTML download');
    assert.ok(entry.duration > 8 && entry.duration < 16);
    assert.ok(entry.peak < .95 && entry.rms > .03, 'Recording must be audible without clipping');
    assert.equal(entry.sampleRate, 44100);
    assert.equal(entry.channels, 1);
    hashes.add(entry.sha256);
    totalBytes += bytes.length;
  }
  assert.equal(hashes.size, 3);
  assert.equal(totalBytes, report.totalBytes);
  assert.ok(totalBytes < 400000);
});
