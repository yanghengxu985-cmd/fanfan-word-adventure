import type { SemanticSceneProps } from './ChineseSemanticScene';
import { getPolishedMiddleFrame } from './polishedMiddleFrames';
import { getPolishedEarlyFrame } from './polishedEarlyFrames';
import { getPolishedLateFrame } from './polishedLateFrames';

export function getPolishedFrame(props: SemanticSceneProps) {
  return getPolishedEarlyFrame(props) ?? getPolishedMiddleFrame(props) ?? getPolishedLateFrame(props);
}
