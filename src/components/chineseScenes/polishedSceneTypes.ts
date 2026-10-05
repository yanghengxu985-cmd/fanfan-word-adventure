import type { SemanticSceneProps } from './ChineseSemanticScene';

/** Source art remains intact; a selected atlas cell is clipped only while rendering. */
export type PolishedFrame = {
  sceneKey?: string;
  file: string;
  index: number;
  columns: number;
  rows: number;
  caption: string;
  objects: string[];
  /** Optional close view in the cell's normalized 900 × 600 coordinates. */
  crop?: { x: number; y: number; width: number; height: number };
  /** A short, once-through action sequence, with the final state held on screen. */
  sequence?: { frames: PolishedFrame[]; frameDurationMs: number };
};

export type PolishedFrameResolver = (props: SemanticSceneProps) => PolishedFrame | null;
