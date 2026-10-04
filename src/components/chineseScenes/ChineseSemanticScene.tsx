import ChineseNatureScenes, { supportsNatureScene } from './ChineseNatureScenes';
import ChineseStoryScenes, { supportsStoryScene } from './ChineseStoryScenes';
import ChinesePoemScenes from './ChinesePoemScenes';
import ChineseIllustratedScenes, { getIllustratedFrame } from './ChineseIllustratedScenes';

export type SemanticSceneProps = {
  courseId: string; step: number; variant?: string; sceneKey?: string;
  parameter?: number; gains?: Record<string, number>; paused?: boolean;
};

export function supportsSemanticScene(courseId: string) {
  return courseId === 'cn-04' || courseId === 'cn-20' || supportsNatureScene(courseId) || supportsStoryScene(courseId);
}

/** An option identifies the object/action; a shared numeric step cannot do that. */
export default function ChineseSemanticScene(props: SemanticSceneProps) {
  if (props.variant && (props.courseId === 'cn-04' || props.courseId === 'cn-20')) return <ChinesePoemScenes {...props} variant={props.variant} />;
  if (getIllustratedFrame(props) !== null) {
    const fallback = supportsNatureScene(props.courseId) ? <ChineseNatureScenes {...props} /> : <ChineseStoryScenes {...props} />;
    return <ChineseIllustratedScenes {...props} fallback={fallback} />;
  }
  if (supportsNatureScene(props.courseId)) return <ChineseNatureScenes {...props} />;
  if (supportsStoryScene(props.courseId)) return <ChineseStoryScenes {...props} />;
  return null;
}
