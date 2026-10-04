import { useId, type CSSProperties } from 'react'
import {
  clampKingfisherProgress,
  getKingfisherFrame,
  getKingfisherWingBeat,
  KINGFISHER_WATER_ANCHOR,
  type KingfisherPose,
} from '../lib/kingfisherMotion'
import './KingfisherScene.css'

export type KingfisherPart = 'feathers' | 'wings' | 'beak'

export type KingfisherSceneProps = {
  mode: 'observe' | 'catch'
  progress: number
  selectedPart?: KingfisherPart | null
  onSelectPart?: (part: KingfisherPart) => void
  reducedMotion?: boolean
}

type SceneStyle = CSSProperties & Record<`--kf-${string}`, string | number>
type PoseLayer = { pose: KingfisherPose; opacity: number }
const imageBase = `${import.meta.env.BASE_URL}images/kingfisher/`

const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

const partDetails: Array<{ id: KingfisherPart; label: string; detail: string; x: number; y: number }> = [
  { id: 'feathers', label: '羽毛', detail: '翠绿的羽毛', x: 51, y: 27 },
  { id: 'wings', label: '翅膀', detail: '带着蓝色的翅膀', x: 39, y: 54 },
  { id: 'beak', label: '长嘴', detail: '红色的长嘴', x: 78, y: 40 },
]

// Blend atlas layers using progress itself. A paused/scrubbed scene never has
// an unfinished CSS transition running after its parent has stopped playback.
function poseLayers(t: number, pose: KingfisherPose): PoseLayer[] {
  const blends: Array<[number, number, KingfisherPose, KingfisherPose]> = [
    [2, 2.16, 0, 1],
    [9.76, 10, 2, 3],
    [12, 12.18, 3, 4],
    [13.3, 13.5, 4, 5],
  ]
  for (const [from, to, before, after] of blends) {
    if (t >= from && t < to) {
      const weight = smooth((t - from) / (to - from))
      return [{ pose: before, opacity: 1 - weight }, { pose: after, opacity: weight }]
    }
  }
  return [{ pose, opacity: 1 }]
}

function facingAt(t: number) {
  // A short edge-on turn avoids an abrupt right-facing/left-facing flip.
  if (t < 7.05) return 1
  if (t < 7.55) return Math.cos(Math.PI * smooth((t - 7.05) / 0.5))
  if (t < 9.65) return -1
  if (t < 10) return -Math.cos(Math.PI * smooth((t - 9.65) / 0.35))
  return 1
}

function reducedProgress(t: number) {
  if (t < 2) return 0
  if (t < 4) return 3.65
  if (t < 5) return 4.5
  if (t < 8) return 6.3
  if (t < 10) return 9.45
  if (t < 12) return 11
  if (t < 13.5) return 12.8
  if (t < 14) return 13.7
  return 16
}

function rippleAt(progress: number, start: number, index: number) {
  const age = progress - start - index * 0.15
  if (age < 0 || age > 1.25) return { opacity: 0, transform: 'translate(-50%, -50%) scale(0.3)' }
  const q = age / 1.25
  return {
    opacity: smooth(age / 0.08) * (1 - smooth(q)) * 0.8,
    transform: `translate(-50%, -50%) scale(${0.3 + q * 1.6})`,
  }
}

/** The bird and river are generated raster assets; only controls and ripples are HTML/CSS. */
export default function KingfisherScene({
  mode,
  progress,
  selectedPart = null,
  onSelectPart,
  reducedMotion = false,
}: KingfisherSceneProps) {
  const uid = useId()
  const t = clampKingfisherProgress(progress)
  const motionT = reducedMotion ? reducedProgress(t) : t
  const frame = getKingfisherFrame(motionT)
  const observed = mode === 'observe'
  const interactive = observed && Boolean(onSelectPart)
  const layers = observed ? [{ pose: 0 as const, opacity: 1 }] : poseLayers(motionT, frame.pose)
  const wingBeat = observed || reducedMotion ? 0 : getKingfisherWingBeat(motionT)
  const sceneStyle: SceneStyle = {
    '--kf-bird-x': `${observed ? 51 : frame.x}%`,
    '--kf-bird-y': `${observed ? 88 : frame.y}%`,
    '--kf-bird-rotation': `${observed ? 0 : frame.rotation}deg`,
    '--kf-bird-scale': observed ? 1 : frame.scale,
    '--kf-bird-opacity': observed ? 1 : frame.opacity,
    '--kf-bird-facing': observed ? 1 : facingAt(motionT),
    '--kf-water-x': `${KINGFISHER_WATER_ANCHOR.x}%`,
    '--kf-water-y': `${KINGFISHER_WATER_ANCHOR.y}%`,
    '--kf-atlas-image': `url("${imageBase}kingfisher-poses-v2.png")`,
    '--kf-flight-down-image': `url("${imageBase}kingfisher-flight-down-v2.png")`,
  }
  const sceneLabel = observed
    ? `观察翠鸟的翠绿色羽毛、蓝色翅膀和红色长嘴。${interactive ? '点击画中的部位。' : ''}`
    : `翠鸟捕鱼演示，${getKingfisherFrame(t).phase}。`

  return (
    <figure
      className={`kf-scene kf-scene--${mode}`}
      style={sceneStyle}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-labelledby={`${uid}-caption`}
    >
      <img
        className="kf-scene__landscape"
        src={`${imageBase}river-scene-v2.png`}
        alt="江面上停着一只木船，船头伸向水面，远处山岸安静朦胧。"
        draggable={false}
      />
      <div className="kf-scene__shade" aria-hidden="true" />

      {!observed && !reducedMotion && (
        <div className="kf-scene__water" aria-hidden="true">
          {[0, 1, 2].map(index => (
            <span key={`in-${index}`} className="kf-scene__ripple" style={rippleAt(t, 3.86, index)} />
          ))}
          {[0, 1, 2].map(index => (
            <span key={`out-${index}`} className="kf-scene__ripple kf-scene__ripple--emerge" style={rippleAt(t, 5, index)} />
          ))}
        </div>
      )}

      <div className="kf-scene__bird-anchor">
        <div className="kf-scene__bird" aria-hidden="true">
          {layers.flatMap(layer => [
            <div
              key={layer.pose}
              className="kf-scene__pose"
              data-pose={layer.pose}
              style={{
                backgroundPosition: `${(layer.pose % 3) * 50}% ${layer.pose < 3 ? 0 : 100}%`,
                opacity: layer.opacity * (layer.pose === 2 ? 1 - wingBeat : 1),
              }}
            />,
            ...(layer.pose === 2 ? [
              <div
                key="wing-down"
                className="kf-scene__pose kf-scene__pose--wing-down"
                style={{ opacity: layer.opacity * wingBeat }}
              />,
            ] : []),
          ])}
        </div>
        {interactive && (
          <div className="kf-scene__parts" role="group" aria-label="选择要观察的翠鸟部位">
            {partDetails.map(part => (
              <button
                key={part.id}
                type="button"
                className={`kf-scene__part kf-scene__part--${part.id}`}
                style={{ left: `${part.x}%`, top: `${part.y}%` }}
                aria-label={`观察${part.detail}`}
                aria-pressed={selectedPart === part.id}
                onClick={() => onSelectPart?.(part.id)}
              >
                <span className="kf-scene__part-dot" aria-hidden="true" />
                <span className="kf-scene__part-label">{part.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <figcaption id={`${uid}-caption`} className="kf-scene__caption">
        <span className="kf-scene__caption-rule" aria-hidden="true" />
        <span>{observed ? (interactive ? '近看翠鸟 · 点击羽毛、翅膀或长嘴' : '近看翠鸟的外形') : getKingfisherFrame(t).phase}</span>
      </figcaption>
      <span className="kf-scene__sr-only">{sceneLabel}</span>
    </figure>
  )
}
