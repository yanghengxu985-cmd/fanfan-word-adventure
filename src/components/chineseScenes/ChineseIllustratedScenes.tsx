import { useState, type ReactNode } from 'react';
import type { SemanticSceneProps } from './ChineseSemanticScene';

function Frame({ courseId, index, x = 0, y = 0, width = 900, height = 600 }: {
  courseId: string; index: number; x?: number; y?: number; width?: number; height?: number;
}) {
  if (courseId === 'cn-05') return <image href={`${import.meta.env?.BASE_URL ?? '/'}images/chinese-scenes/cn-05-footsteps.webp`} width="900" height="600" />;
  const context = courseId === 'cn-23' && index >= 6;
  const frame = context ? index === 6 ? 0 : 2 : index;
  const rows = courseId === 'cn-23' && !context ? 3 : 2;
  const source = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-scenes/${courseId}-${context ? 'context' : 'atlas'}.webp`;
  // The grid is a source texture, not an on-screen comic. Display one selected frame.
  return <svg x={x} y={y} width={width} height={height}
    viewBox={`${frame % 2 * 900 + 1} ${Math.floor(frame / 2) * 600 + 1} 898 598`} preserveAspectRatio="xMidYMid slice">
    <image href={source} width="1800" height={rows * 600} preserveAspectRatio="none" />
  </svg>;
}

function ObjectGroup({ objects, children }: { objects: string[]; children: ReactNode }): ReactNode {
  return objects.reduceRight<ReactNode>((content, object) => <g data-scene-object={object}>{content}</g>, children);
}

function Caption({ x = 25, y = 547, width = 850, children }: { x?: number; y?: number; width?: number; children: string }) {
  return <g><rect x={x} y={y} width={width} height="34" rx="9" fill="#fff8e9" fillOpacity=".93" />
    <text x={x + width / 2} y={y + 23} textAnchor="middle" fill="#344f44" fontSize="20" fontFamily="KaiTi, STKaiti, serif">{children}</text>
  </g>;
}

export function getIllustratedFrame({ courseId, step, sceneKey }: SemanticSceneProps) {
  if (courseId === 'cn-05') return !sceneKey && step === 3 ? 0 : null;
  if (courseId === 'cn-06') return ({ leaves: 0, fruit: 1, squirrel: 2, frog: 3 } as Record<string, number>)[sceneKey ?? ''] ?? (step === 0 || step === 1 ? 0 : step === 2 ? 1 : 2);
  if (courseId === 'cn-18') return ({ spring: 0, summer: 1, autumn: 2, winter: 3 } as Record<string, number>)[sceneKey ?? ''] ?? Math.min(step, 3);
  if (courseId === 'cn-23') {
    const frames: Record<string, number> = { fall: 0, falling: 0, 'ref-child': 0, 'ref-jar': 0, 'ref-toward': 0,
      break: 1, breaking: 1, 'hold-stone': 1, 'strike-jar': 2, 'crack-jar': 3, 'flowing-water': 4, saved: 5, saving: 5, play: 6, playing: 6, leave: 7, leaving: 7, 'ref-leave': 7 };
    return sceneKey ? frames[sceneKey] ?? null : [6, 0, 7, 1][Math.min(step, 3)];
  }
  return null;
}

/** Fine painted frames for concrete observations. Returns null for other story actions. */
export default function ChineseIllustratedScenes(props: SemanticSceneProps & { fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const index = getIllustratedFrame(props);
  if (index === null || failed) return props.fallback;
  const { courseId, step, sceneKey } = props;
  let objects: string[] = [];
  let caption = '';
  if (courseId === 'cn-05') {
    objects = ['brown-rain-boots', 'irregular-leaf-carpet', 'puddle-blue-sky-reflection'];
    caption = '棕红色的小雨靴走在金黄落叶上';
  } else if (courseId === 'cn-06') {
    objects = index === 0 ? ['ginkgo-fan-leaves', 'red-maple-leaves', 'golden-field', 'multicolour-chrysanthemums']
      : index === 1 ? ['fruit-tree', 'child-noticing-fruit'] : index === 2 ? ['squirrel', 'pine-cone', 'pine-cone-store'] : ['frog', 'frog-winter-hole'];
    caption = ['银杏叶、枫叶、田野、果实和菊花，各有颜色', '梨和橘子成熟了：香味是闻到的，画面只作想象', '小松鼠找来松果，准备过冬', '小青蛙来到洞口，准备过冬'][index];
  } else if (courseId === 'cn-18') {
    objects = ['same-forest-trees', 'same-forest-stream', ...[
      ['spring-new-leaves', 'melting-snow', 'deer'], ['summer-forest-mist', 'summer-sunbeams', 'summer-wildflowers'],
      ['autumn-coloured-leaves', 'forest-grapes-and-mushrooms'], ['winter-snow', 'squirrel', 'pine-cone', 'sable', 'bear-winter-den'],
    ][index]];
    caption = ['春：新叶、融雪、溪水与小鹿', '夏：浓荫、晨雾、阳光与野花', '秋：落叶、山葡萄与蘑菇', '冬：积雪与动物的过冬活动'][index];
  } else {
    objects = ['water-jar', ...[
      ['child-in-jar'], ['stone', 'holding-stone', 'child-in-jar'], ['stone', 'striking', 'child-in-jar'],
      ['cracked-jar', 'child-in-jar'], ['flowing-water', 'child-in-jar'], ['broken-jar', 'rescued-child'], ['children-playing'], ['children-leaving', 'child-in-jar'],
    ][index]];
    caption = ['孩子落进水瓮里', '持石：司马光双手拿起石头', '击瓮：石头接触瓮壁', '破之：瓮壁出现破口', '水迸：水从破口涌出', '儿得活：孩子已经获救', '群儿戏于庭：孩子在庭院里玩耍', '众皆弃去：其他孩子跑开，司马光留在庭院'][index];
  }
  return <svg className="chinese-painted-scene" viewBox="0 0 900 600" role="img" aria-label={caption}
    data-course={courseId} data-scene-key={sceneKey || `read-${step}`} data-atlas-frame={index}
    onError={() => setFailed(true)}>
    <title>{caption}</title>
    <ObjectGroup objects={objects}><Frame courseId={courseId} index={index} /></ObjectGroup>
    {courseId === 'cn-06' && step === 3 && !sceneKey && <g data-scene-object="frog">
      <rect x="572" y="17" width="310" height="232" rx="10" fill="#fff8e9" />
      <Frame courseId={courseId} index={3} x={578} y={23} width={298} height={199} />
      <text x="727" y="242" textAnchor="middle" fill="#344f44" fontSize="20">青蛙来到洞口</text>
    </g>}
    {sceneKey === 'ref-child' && <ellipse cx="692" cy="289" rx="98" ry="85" fill="none" stroke="#ffe4a4" strokeWidth="5" />}
    {sceneKey === 'ref-jar' && <ellipse cx="700" cy="405" rx="186" ry="176" fill="none" stroke="#ffe4a4" strokeWidth="5" />}
    {sceneKey === 'ref-toward' && <g data-scene-object="toward-child" fill="none" stroke="#ffe4a4" strokeWidth="5"><path d="M454 322Q522 243 649 292" /><path d="m629 274 22 19-28 8" /></g>}
    {sceneKey === 'ref-leave' && <ellipse cx="251" cy="300" rx="130" ry="91" fill="none" stroke="#ffe4a4" strokeWidth="5" />}
    <Caption>{caption}</Caption>
  </svg>;
}
