import { useId } from 'react'
import './oldHouseScene.css'

export type OldHouseStage = 'opening' | 'cat' | 'hen' | 'spider'

export type OldHouseSceneProps = {
  stage: OldHouseStage
  revealed?: boolean
  reducedMotion?: boolean
}

const imageBase = new URL(`${import.meta.env.BASE_URL}images/old-house/`, document.baseURI).href
const stageNotes: Record<OldHouseStage, { title: string; caption: string }> = {
  opening: { title: '老屋', caption: '老屋很旧了，它准备倒下。' },
  cat: { title: '小猫', caption: '小猫来求助：夜里有雨，它需要一个安心睡觉的地方。' },
  hen: { title: '母鸡', caption: '母鸡来求助：它想找个安静的地方，把蛋孵完。' },
  spider: { title: '蜘蛛', caption: '蜘蛛来求助：它想借这里结网、捉虫。' },
}

export default function OldHouseScene({ stage, revealed = false, reducedMotion = false }: OldHouseSceneProps) {
  const uid = useId()
  const note = stageNotes[stage]
  const raining = stage === 'cat' && !revealed

  return (
    <figure
      className={`oh-scene oh-scene--${stage}`}
      data-stage={stage}
      data-revealed={revealed ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-labelledby={`${uid}-caption`}
    >
      <picture>
      <source srcSet={`${imageBase}old-house-landscape-v1.webp`} type="image/webp" />
      <img
        className="oh-scene__landscape"
        src={`${imageBase}old-house-landscape-v1.png`}
        alt="树林旁的一间老屋，门前有一条小路。"
        draggable={false}
      />
      </picture>
      {raining && (
        <div className="oh-scene__rain" aria-hidden="true">
          {Array.from({ length: 11 }, (_, index) => <i key={index} style={{ left: `${8 + index * 8}%`, animationDelay: `${-index * 0.27}s` }} />)}
        </div>
      )}
      {stage !== 'opening' && (
        <div className={`oh-scene__visitor oh-scene__visitor--${stage}`} aria-label={`当前来访：${note.title}`}>
          <picture className="oh-scene__visitor-source"><source srcSet={`${imageBase}${stage}-v1.webp`} type="image/webp" /><img className="oh-scene__visitor-picture" src={`${imageBase}${stage}-v1.png`} alt="" draggable={false} /></picture>
          <span className="oh-scene__visitor-label">{stage === 'spider' ? '蜘蛛 · 放大' : note.title}</span>
        </div>
      )}
      <div className="oh-scene__bookmark" aria-hidden="true">
        <span>读到这里</span>
        <strong>{stage === 'opening' ? '故事开始' : `${note.title}来求助`}</strong>
      </div>
      <figcaption id={`${uid}-caption`} className="oh-scene__caption">
        <span className="oh-scene__caption-rule" aria-hidden="true" />
        <span>{revealed ? '故事继续了，回头看看刚才的预测和依据。' : note.caption}</span>
      </figcaption>
    </figure>
  )
}
