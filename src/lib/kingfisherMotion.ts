export const KINGFISHER_DURATION = 16

export type KingfisherPose = 0 | 1 | 2 | 3 | 4 | 5
export type KingfisherVerb = 'chong' | 'fei' | 'xian' | 'zhan' | 'tun'

export type KingfisherFrame = {
  x: number
  y: number
  rotation: number
  scale: number
  pose: KingfisherPose
  opacity: number
  hasFish: boolean
  activeVerbs: KingfisherVerb[]
  phase: string
}

/**
 * Coordinates are percentages of the whole river scene. They position the
 * atlas cell's (50%, 86%) anchor, close to the feet in the standing poses.
 * Every pose uses this same anchor; flying poses do not switch to a body
 * centre. The component exposes --kf-anchor-x/y for final asset calibration.
 *
 * Calibrated to the 1536×1024 illustration: boat tip (46, 60), water (75, 82).
 * All interpolation depends only on progress; there is no wall clock, random
 * input, accumulated state, or CSS animation involved in the flight.
 */
export const KINGFISHER_BOAT_ANCHOR = { x: 46, y: 60 } as const
export const KINGFISHER_WATER_ANCHOR = { x: 75, y: 82 } as const

type Point = { x: number; y: number }

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const smooth = (value: number) => {
  const t = clamp01(value)
  return t * t * (3 - 2 * t)
}
const mix = (from: number, to: number, t: number) => from + (to - from) * t

function bezier(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u ** 3 * a.x + 3 * u ** 2 * t * b.x + 3 * u * t ** 2 * c.x + t ** 3 * d.x,
    y: u ** 3 * a.y + 3 * u ** 2 * t * b.y + 3 * u * t ** 2 * c.y + t ** 3 * d.y,
  }
}

/** Invalid progress returns the beginning; out-of-range progress is clamped. */
export function clampKingfisherProgress(progress: number): number {
  return Number.isNaN(progress) ? 0 : Math.min(KINGFISHER_DURATION, Math.max(0, progress))
}

/** Downstroke opacity. A held progress value also holds the exact wing beat. */
export function getKingfisherWingBeat(progress: number): number {
  const t = clampKingfisherProgress(progress)
  if (t < 5 || t >= 10) return 0
  const beat = ((t - 5) / 0.36) % 1
  if (beat < 0.26) return 0
  if (beat < 0.44) return smooth((beat - 0.26) / 0.18)
  if (beat < 0.72) return 1
  if (beat < 0.9) return 1 - smooth((beat - 0.72) / 0.18)
  return 0
}

export function getKingfisherFrame(progress: number): KingfisherFrame {
  const t = clampKingfisherProgress(progress)
  const base: KingfisherFrame = {
    ...KINGFISHER_BOAT_ANCHOR,
    rotation: 0,
    scale: 1,
    pose: 0,
    opacity: 1,
    hasFish: false,
    activeVerbs: [],
    phase: '船头停歇',
  }

  if (t < 2) return base

  if (t < 4) {
    const q = (t - 2) / 2
    // Accelerate into the dive; a shallow lift joins the perch to the plunge.
    const path = bezier(
      KINGFISHER_BOAT_ANCHOR,
      { x: 55, y: 48 },
      { x: 66, y: 60 },
      KINGFISHER_WATER_ANCHOR,
      q ** 1.55,
    )
    return {
      ...base,
      ...path,
      rotation: mix(0, 22, smooth(q)),
      scale: mix(1, 0.88, smooth(q)),
      pose: 1,
      opacity: 1 - smooth((t - 3.84) / 0.16),
      activeVerbs: ['chong'],
      phase: '冲向水面',
    }
  }

  if (t < 5) {
    return {
      ...base,
      ...KINGFISHER_WATER_ANCHOR,
      pose: 1,
      opacity: 0,
      scale: 0.88,
      activeVerbs: ['chong'],
      phase: '潜入水下',
    }
  }

  if (t < 8) {
    const q = (t - 5) / 3
    const path = bezier(
      KINGFISHER_WATER_ANCHOR,
      { x: 79, y: 54 },
      { x: 88, y: 38 },
      { x: 76, y: 40 },
      q,
    )
    return {
      ...base,
      ...path,
      rotation: mix(-48, 0, smooth(q)),
      scale: mix(0.88, 1, smooth(q)),
      pose: 2,
      opacity: smooth((t - 5) / 0.15),
      hasFish: true,
      activeVerbs: ['fei', 'xian'],
      phase: '飞起衔鱼',
    }
  }

  if (t < 10) {
    const q = (t - 8) / 2
    // The incoming curve shares the outgoing curve's leftward tangent.
    // Its final easing settles the feet at the very same boat anchor.
    const path = bezier(
      { x: 76, y: 40 },
      { x: 64, y: 40 },
      { x: 50, y: 48 },
      KINGFISHER_BOAT_ANCHOR,
      1 - (1 - q) ** 1.35,
    )
    return {
      ...base,
      ...path,
      rotation: -18 * Math.sin(Math.PI * q),
      pose: 2,
      hasFish: true,
      activeVerbs: ['fei', 'xian'],
      phase: '衔鱼返船',
    }
  }

  if (t < 12) {
    return {
      ...base,
      pose: 3,
      hasFish: true,
      activeVerbs: ['zhan', 'xian'],
      phase: '站定衔鱼',
    }
  }

  if (t < 14) {
    const swallowed = t >= 13.5
    return {
      ...base,
      pose: swallowed ? 5 : 4,
      // Fish remains present through the first part of the swallowing action.
      hasFish: !swallowed,
      activeVerbs: ['tun'],
      phase: '仰头吞鱼',
    }
  }

  return { ...base, pose: 5, phase: '吞鱼后停歇' }
}
