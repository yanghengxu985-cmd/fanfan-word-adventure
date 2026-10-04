import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getKingfisherFrame,
  getKingfisherWingBeat,
  KINGFISHER_BOAT_ANCHOR,
  KINGFISHER_DURATION,
} from './kingfisherMotion'

test('paused progress is deterministic and returning to it produces the same frame', () => {
  const paused = getKingfisherFrame(6.35)
  for (const progress of [0, 16, 11.7, 3, 8, 4.6]) getKingfisherFrame(progress)
  assert.deepEqual(getKingfisherFrame(6.35), paused)
  assert.deepEqual(getKingfisherFrame(6.35), paused)
  paused.activeVerbs.pop()
  assert.deepEqual(getKingfisherFrame(6.35).activeVerbs, ['fei', 'xian'])
})

test('wing beats are progress driven, repeat every 0.36 seconds, and stop outside flight', () => {
  const paused = getKingfisherWingBeat(6.2)
  for (const progress of [6.4, 8.7, 9.95]) getKingfisherWingBeat(progress)
  assert.equal(getKingfisherWingBeat(6.2), paused)
  for (const progress of [5.03, 5.13, 6.2, 8.77]) {
    assert.ok(Math.abs(getKingfisherWingBeat(progress) - getKingfisherWingBeat(progress + 0.36)) < 0.000001)
  }
  assert.equal(getKingfisherWingBeat(4.9), 0)
  assert.equal(getKingfisherWingBeat(10), 0)
  assert.equal(getKingfisherWingBeat(5.18), 1)
})

test('the timeline clamps boundaries and begins/ends at the same boat anchor', () => {
  assert.equal(KINGFISHER_DURATION, 16)
  const first = getKingfisherFrame(0)
  const last = getKingfisherFrame(16)
  assert.equal(first.pose, 0)
  assert.equal(last.pose, 5)
  assert.deepEqual({ x: first.x, y: first.y }, KINGFISHER_BOAT_ANCHOR)
  assert.deepEqual({ x: last.x, y: last.y }, KINGFISHER_BOAT_ANCHOR)
  assert.equal(first.hasFish, false)
  assert.equal(last.hasFish, false)
  assert.deepEqual(getKingfisherFrame(-100), first)
  assert.deepEqual(getKingfisherFrame(Number.NaN), first)
  assert.deepEqual(getKingfisherFrame(100), last)
})

test('the bird disappears underwater and emerges already carrying a fish', () => {
  assert.equal(getKingfisherFrame(3.5).hasFish, false)
  for (const progress of [4, 4.25, 4.8, 4.999]) {
    const frame = getKingfisherFrame(progress)
    assert.equal(frame.opacity, 0)
    assert.equal(frame.hasFish, false)
  }
  for (const progress of [5, 5.1, 6.2, 7.99, 8, 9.7]) {
    const frame = getKingfisherFrame(progress)
    assert.equal(frame.hasFish, true)
    assert.equal(frame.pose, 2)
    assert.deepEqual(frame.activeVerbs, ['fei', 'xian'])
  }
})

test('returning to the boat keeps the fish until the swallowing action', () => {
  for (let progress = 5; progress < 12; progress += 0.125) {
    assert.equal(getKingfisherFrame(progress).hasFish, true, `fish vanished at ${progress}`)
  }
  for (const progress of [10, 10.5, 11.99]) {
    const frame = getKingfisherFrame(progress)
    assert.equal(frame.pose, 3)
    assert.deepEqual({ x: frame.x, y: frame.y }, KINGFISHER_BOAT_ANCHOR)
    assert.deepEqual(frame.activeVerbs, ['zhan', 'xian'])
    assert.equal(frame.hasFish, true)
  }
  assert.equal(getKingfisherFrame(12.2).pose, 4)
  assert.deepEqual(getKingfisherFrame(12.2).activeVerbs, ['tun'])
  for (const progress of [13.5, 14, 15.5, 16]) {
    assert.equal(getKingfisherFrame(progress).pose, 5)
    assert.equal(getKingfisherFrame(progress).hasFish, false)
  }
})

test('flight paths join continuously and every visible frame remains finite', () => {
  for (const boundary of [2, 4, 5, 8, 10, 12, 14]) {
    const before = getKingfisherFrame(boundary - 0.00001)
    const after = getKingfisherFrame(boundary)
    assert.ok(Math.hypot(before.x - after.x, before.y - after.y) < 0.001, `position jumps at ${boundary}`)
    assert.ok(Math.abs(before.scale - after.scale) < 0.001, `scale jumps at ${boundary}`)
  }
  for (const boundary of [2, 8, 10, 12, 14]) {
    const before = getKingfisherFrame(boundary - 0.00001)
    const after = getKingfisherFrame(boundary)
    assert.ok(Math.abs(before.rotation - after.rotation) < 0.001, `rotation jumps at ${boundary}`)
  }
  for (let progress = 0; progress <= 16; progress += 0.01) {
    const frame = getKingfisherFrame(progress)
    for (const key of ['x', 'y', 'rotation', 'scale', 'opacity'] as const) {
      assert.ok(Number.isFinite(frame[key]), `${key} is not finite at ${progress}`)
    }
    assert.ok(frame.opacity >= 0 && frame.opacity <= 1)
    assert.ok(frame.x >= 0 && frame.x <= 100)
    assert.ok(frame.y >= 0 && frame.y <= 100)
  }
})
