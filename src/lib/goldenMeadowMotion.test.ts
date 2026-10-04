import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clampGoldenMeadowOpenness,
  getGoldenMeadowFrame,
  GOLDEN_MEADOW_DURATION,
  GOLDEN_MEADOW_PRESETS,
} from './goldenMeadowMotion'

test('three direct time presets show closed → open → closed on the same flower', () => {
  assert.equal(GOLDEN_MEADOW_DURATION, 18)
  const frames = GOLDEN_MEADOW_PRESETS.map(item => getGoldenMeadowFrame(item.at))
  assert.deepEqual(frames.map(item => item.period), ['morning', 'noon', 'evening'])
  assert.deepEqual(frames.map(item => item.openness), [0, 1, 0])
  assert.deepEqual(frames.map(item => item.phase), ['closed', 'open', 'closed'])
  assert.match(frames[0].caption, /绿色/)
  assert.match(frames[1].caption, /金色/)
  assert.match(frames[2].caption, /绿色/)
})

test('paused or revisited progress reproduces the exact flower state', () => {
  const held = getGoldenMeadowFrame(5.35)
  for (const progress of [0, 18, 12, 8.4, 3.2]) getGoldenMeadowFrame(progress)
  assert.deepEqual(getGoldenMeadowFrame(5.35), held)
  assert.deepEqual(getGoldenMeadowFrame(5.35), held)
  assert.ok(held.openness > 0 && held.openness < 1)
})

test('opening is monotonic, closing is its reverse, and the two transitions join continuously', () => {
  let previous = 0
  for (let progress = 3; progress <= 7.5; progress += 0.025) {
    const frame = getGoldenMeadowFrame(progress)
    assert.ok(frame.openness >= previous)
    assert.ok(Math.abs(frame.openness - getGoldenMeadowFrame(18 - progress).openness) < 0.000001)
    previous = frame.openness
  }
  previous = 1
  for (let progress = 10.5; progress <= 15; progress += 0.025) {
    const openness = getGoldenMeadowFrame(progress).openness
    assert.ok(openness <= previous)
    previous = openness
  }
  for (const boundary of [3, 7.5, 10.5, 15]) {
    const before = getGoldenMeadowFrame(boundary - 0.00001).openness
    const after = getGoldenMeadowFrame(boundary + 0.00001).openness
    assert.ok(Math.abs(before - after) < 0.00001, `flower jumps at ${boundary}`)
  }
})

test('invalid and out-of-range progress and manual close-up inputs stay bounded', () => {
  const first = getGoldenMeadowFrame(0)
  const last = getGoldenMeadowFrame(18)
  for (const progress of [-20, -Infinity, Number.NaN]) assert.deepEqual(getGoldenMeadowFrame(progress), first)
  for (const progress of [40, Infinity]) assert.deepEqual(getGoldenMeadowFrame(progress), last)
  assert.equal(clampGoldenMeadowOpenness(-0.5), 0)
  assert.equal(clampGoldenMeadowOpenness(2), 1)
  assert.equal(clampGoldenMeadowOpenness(Number.NaN), 0)
  assert.equal(clampGoldenMeadowOpenness(0.35), 0.35)
  for (let progress = 0; progress <= 18; progress += 0.025) {
    const frame = getGoldenMeadowFrame(progress)
    assert.ok(Number.isFinite(frame.openness))
    assert.ok(frame.openness >= 0 && frame.openness <= 1)
  }
})
