import { useId, useState } from 'react'
import { PolishedAtlasImage } from './chineseScenes/ChinesePolishedScene'
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
  const [failed, setFailed] = useState(false)
  const note = stageNotes[stage]
  const index = (stage === 'cat' ? 0 : stage === 'hen' ? 2 : 4) + (revealed ? 1 : 0)
  const outcomes = { cat:'小猫在老屋里安心睡了一夜。', hen:'母鸡在老屋里安静地孵蛋。', spider:'蜘蛛在老屋结网捉虫，继续讲着故事。' }

  return (
    <figure
      className={`oh-scene oh-scene--${stage}`}
      data-stage={stage}
      data-revealed={revealed ? 'true' : 'false'}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      aria-labelledby={`${uid}-caption`}
    >
      {stage === 'opening' || failed ? <picture>
      <source srcSet={`${imageBase}old-house-landscape-v1.webp`} type="image/webp" />
      <img
        className="oh-scene__landscape"
        src={`${imageBase}old-house-landscape-v1.png`}
        alt="树林旁的一间老屋，门前有一条小路。"
        draggable={false}
      />
      </picture> : <svg className="oh-scene__painted" viewBox="0 0 900 600" role="img" aria-label={revealed ? outcomes[stage] : note.caption} data-polished-frame={index}>
        <title>{revealed ? outcomes[stage] : note.caption}</title>
        <PolishedAtlasImage frame={{file:'images/chinese-polished/cn-08-atlas-v3.webp',index,columns:2,rows:3,caption:note.caption,objects:[]}} onError={() => setFailed(true)} />
      </svg>}
      <div className="oh-scene__bookmark" aria-hidden="true">
        <span>读到这里</span>
        <strong>{stage === 'opening' ? '故事开始' : revealed ? `${note.title}的后续` : `${note.title}来求助`}</strong>
      </div>
      <figcaption id={`${uid}-caption`} className="oh-scene__caption">
        <span className="oh-scene__caption-rule" aria-hidden="true" />
        <span>{revealed && stage !== 'opening' ? outcomes[stage] : note.caption}</span>
      </figcaption>
    </figure>
  )
}
