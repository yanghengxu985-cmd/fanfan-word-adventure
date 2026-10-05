import { useId } from 'react';
import './transferObservationScene.css';

/** A comparison strip needs no new controls, and preserves the portrait source cells. */
export default function TransferObservationScene({ subject }: { subject:'dog'|'dew' }) {
  const uid=useId();
  const row=subject==='dog'?0:1;
  const labels=subject==='dog'?['靠近小球','叼起小球','跑回主人身边']:['早晨 · 有露珠','中午 · 未见露珠','傍晚 · 未见露珠'];
  const title=subject==='dog'?'留心小狗的连续动作':'同一片叶子的三次观察';
  return <figure className="transfer-observation" aria-labelledby={uid} data-transfer-subject={subject}>
    <figcaption id={uid}>{title}</figcaption>
    <div className="transfer-observation__strip">{labels.map((label,index)=><div key={label}>
      <svg viewBox={`${index*418+3} ${row===0?3:568} 412 ${row===0?558:683}`} style={{aspectRatio:row===0?'412/558':'412/683'}} role="img" aria-label={label}>
        <title>{label}</title><image href={`${import.meta.env.BASE_URL}images/chinese-polished/cn-observation-transfer-v3.webp`} width="1254" height="1254" preserveAspectRatio="none" />
      </svg><span>{label}</span>
    </div>)}</div>
  </figure>;
}
