import { ExternalLink } from 'lucide-react';
import { getLessonNatureRecordings } from '../data/chineseNatureSounds';

export default function NatureSoundSources({ courseId }: { courseId: string }) {
  const recordings = getLessonNatureRecordings(courseId);
  if (!recordings.length) return null;
  return <>
    <h3>真实声音的来源</h3>
    <p>三层录音是帮助辨认声源的教学参考，录自不同地点，经过音量调整后组合；不是同一秋天场景的同步实录，也不替代教材朗读。树叶、虫鸣、雁鸣是真实声音，“告别、歌唱、叮咛”是诗人的想象。</p>
    {recordings.map(recording => <div key={recording.source}>
      <a className="cnl-source" href={recording.sourceUrl} target="_blank" rel="noopener noreferrer">
        <strong>{recording.label} · {recording.author}<ExternalLink size={14} /></strong>
        <small>{recording.title} · {recording.description}</small>
      </a>
      <p><a href={recording.licenseUrl} target="_blank" rel="noopener noreferrer">{recording.license}</a> · {recording.changes}</p>
    </div>)}
  </>;
}
