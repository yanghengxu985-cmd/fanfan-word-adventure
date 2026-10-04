export const GOLDEN_MEADOW_DURATION = 18

export type GoldenMeadowPeriod = 'morning' | 'noon' | 'evening'
export type GoldenMeadowPhase = 'closed' | 'opening' | 'open' | 'closing'

export const GOLDEN_MEADOW_PRESETS = [
  { id: 'morning', label: '早晨', at: 0 },
  { id: 'noon', label: '中午', at: 9 },
  { id: 'evening', label: '傍晚', at: GOLDEN_MEADOW_DURATION },
] as const

export type GoldenMeadowFrame = {
  progress: number
  period: GoldenMeadowPeriod
  periodLabel: string
  openness: number
  phase: GoldenMeadowPhase
  caption: string
}

export function clampGoldenMeadowProgress(progress: number): number {
  return Number.isNaN(progress) ? 0 : Math.min(GOLDEN_MEADOW_DURATION, Math.max(0, progress))
}

export function clampGoldenMeadowOpenness(openness: number): number {
  return Number.isNaN(openness) ? 0 : Math.min(1, Math.max(0, openness))
}

function smooth(t: number): number {
  const q = clampGoldenMeadowOpenness(t)
  return q * q * (3 - 2 * q)
}

/**
 * A reading illustration of the text's morning → noon → evening sequence.
 * Seconds are playback positions, not real clock hours or a claim that every
 * living dandelion follows a fixed daily schedule. The same yellow flower
 * closes and opens; there is no transformation to or from a white seed head.
 * This function depends only on progress, so pause and scrubbing are exact.
 */
export function getGoldenMeadowFrame(progress: number): GoldenMeadowFrame {
  const t = clampGoldenMeadowProgress(progress)
  const period: GoldenMeadowPeriod = t < 6 ? 'morning' : t < 12 ? 'noon' : 'evening'
  const periodLabel = GOLDEN_MEADOW_PRESETS.find(item => item.id === period)!.label
  let openness = 0
  let phase: GoldenMeadowPhase = 'closed'
  let caption = '早晨：花朵合拢，草地呈绿色。'

  if (t > 3 && t < 7.5) {
    openness = smooth((t - 3) / 4.5)
    phase = 'opening'
    caption = '花朵逐渐展开，黄色花瓣显露出来。'
  } else if (t >= 7.5 && t <= 10.5) {
    openness = 1
    phase = 'open'
    caption = '中午：花朵张开，草地呈金色。'
  } else if (t > 10.5 && t < 15) {
    openness = 1 - smooth((t - 10.5) / 4.5)
    phase = 'closing'
    caption = '花朵逐渐合拢，黄色花瓣被包住。'
  } else if (t >= 15) {
    caption = '傍晚：花朵再次合拢，草地呈绿色。'
  }

  return { progress: t, period, periodLabel, openness, phase, caption }
}
