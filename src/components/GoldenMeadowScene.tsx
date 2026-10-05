import { memo, useId, type CSSProperties } from 'react'
import { clampGoldenMeadowOpenness, getGoldenMeadowFrame } from '../lib/goldenMeadowMotion'
import './goldenMeadowScene.css'

export type GoldenMeadowSceneProps = {
  mode: 'examine' | 'time'
  progress: number
  /** Optional direct control of the same flower in the close-up view. */
  openness?: number
  reducedMotion?: boolean
}

type MeadowStyle = CSSProperties & Record<`--gm-${string}`, string | number>
type PlantPosition = { x: number; y: number; size: number; angle?: number; flipped?: boolean }
const imageBase = new URL(`${import.meta.env.BASE_URL}images/golden-meadow/`, document.baseURI).href
const polishedImageBase = new URL(`${import.meta.env.BASE_URL}images/chinese-polished/`, document.baseURI).href

// Root positions and sizes are percentages of the un-cropped 3:2 scene.
// All five poses share the cell's (50%, 92%) root anchor, so leaf/stem placement
// never changes as the yellow flower opens or closes.
const meadowRows = [
  { y: 36, size: 2.8, count: 16, start: 16 },
  { y: 43, size: 4.2, count: 14, start: 16 },
  { y: 51, size: 6, count: 12, start: 18 },
  { y: 62, size: 8.4, count: 11, start: 21 },
  { y: 75, size: 12, count: 10, start: 25 },
  { y: 91, size: 16, count: 8, start: 29 },
  { y: 105, size: 21, count: 6, start: 34 },
]
const fieldPlants: PlantPosition[] = meadowRows.flatMap((row, depth) =>
  Array.from({ length: row.count }, (_, index) => ({
    x: row.start + (98 - row.start) * index / (row.count - 1) + [-1.5, 2.1, -0.8, 1.5, 0.1, -2, 0.8][(index + depth * 3) % 7],
    y: row.y + [0, 3.2, -2.1, 1.5, -1.2, 4.1, -2.8][(index + depth * 2) % 7],
    size: row.size * [0.94, 1.1, 0.79, 1.04, 0.85, 1.12, 0.96][(index + depth) % 7],
    angle: [-6, 3, -2, 5, -4, 8, 1][(index + depth) % 7],
    flipped: (index + depth) % 2 === 1,
  })),
)

const Dandelion = memo(function Dandelion({ position, className = '' }: { position?: PlantPosition; className?: string }) {
  const style: MeadowStyle | undefined = position ? {
    '--gm-plant-x': `${position.x}%`,
    '--gm-plant-y': `${position.y}%`,
    '--gm-plant-size': `${position.size}%`,
    '--gm-plant-angle': `${position.angle ?? 0}deg`,
    '--gm-plant-facing': position.flipped ? -1 : 1,
  } : undefined
  return (
    <div className={`gm-scene__plant ${className}`} style={style} aria-hidden="true">
      <div className="gm-scene__plant-body">
        <div className="gm-scene__flower" />
      </div>
    </div>
  )
})

export default function GoldenMeadowScene({ mode, progress, openness, reducedMotion = false }: GoldenMeadowSceneProps) {
  const uid = useId()
  const frame = getGoldenMeadowFrame(progress)
  const examined = mode === 'examine'
  const directOpenness = examined && openness !== undefined
  const requestedOpenness = directOpenness ? clampGoldenMeadowOpenness(openness) : frame.openness
  // Five painted key poses show actual petal shapes; opacity blending would
  // incorrectly superimpose a closed flower on an open one.
  const displayedOpenness = reducedMotion && !directOpenness ? (requestedOpenness >= 0.5 ? 1 : 0) : requestedOpenness
  const pose = Math.round(displayedOpenness * 4)
  const sceneStyle: MeadowStyle = {
    '--gm-openness': displayedOpenness,
    '--gm-flower-image': `url("${polishedImageBase}cn-15-flower-states-v3.webp")`,
    '--gm-flower-x': `${(pose % 2) * 100}%`,
    '--gm-flower-y': `${Math.floor(pose / 2) * 50}%`,
    // Keep the full-open crown intact while excluding neighbouring leaf tips
    // at the atlas cell's upper corners. Intermediate crowns start lower.
    '--gm-flower-clip': pose === 4
      ? 'polygon(1% 2%, 35% 2%, 35% 0%, 65% 0%, 65% 2%, 99% 2%, 99% 99%, 1% 99%)'
      : `inset(${pose === 2 || pose === 3 ? '2%' : '0%'} 1% 1%)`,
  }
  const flowerState = displayedOpenness === 0 ? '花朵合拢' : displayedOpenness === 1 ? '黄色花朵展开' : '花朵正在开合'
  const caption = examined ? `近看同一朵花 · ${flowerState}` : frame.caption

  return (
    <figure
      className={`gm-scene gm-scene--${mode}`}
      style={sceneStyle}
      data-period={frame.period}
      data-phase={examined ? (displayedOpenness === 0 ? 'closed' : displayedOpenness === 1 ? 'open' : 'intermediate') : frame.phase}
      data-flower-pose={pose}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-labelledby={`${uid}-caption`}
    >
      <img
        className="gm-scene__landscape"
        src={`${imageBase}meadow-landscape-v1.png`}
        alt="一片自然草地伸向远处的低丘和树篱。"
        draggable={false}
      />
      {!examined && <div className="gm-scene__daylight" aria-hidden="true" />}
      {examined ? (
        <div className="gm-scene__specimen">
          <Dandelion className="gm-scene__plant--specimen" />
        </div>
      ) : (
        <>
          <div className="gm-scene__field" aria-hidden="true">
            {fieldPlants.map((position, index) => <Dandelion key={index} position={position} />)}
          </div>
          <div className="gm-scene__detail" aria-label={`同一时刻的花朵近看：${flowerState}`}>
            <span className="gm-scene__detail-title">近看这一朵</span>
            <Dandelion className="gm-scene__plant--detail" />
            <span className="gm-scene__detail-state">{displayedOpenness >= 0.5 ? '黄色花瓣显露' : '花瓣被包住'}</span>
          </div>
        </>
      )}
      <figcaption id={`${uid}-caption`} className="gm-scene__caption">
        <span className="gm-scene__caption-rule" aria-hidden="true" />
        <span>{caption}</span>
      </figcaption>
      <span className="gm-scene__sr-only">这是课文中的时段变化示意，演示进度不是实际钟点。同一株蒲公英保持叶茎，黄色花朵展开或合拢。</span>
    </figure>
  )
}
