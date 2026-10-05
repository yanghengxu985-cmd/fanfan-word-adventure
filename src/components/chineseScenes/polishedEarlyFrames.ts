import type { SemanticSceneProps } from './ChineseSemanticScene';
import type { PolishedFrame } from './polishedSceneTypes';

const inset = { x: 9, y: 6, width: 882, height: 588 };
const phase = (step: number) => Math.max(0, Math.min(3, Math.floor(step)));
const bound = (value: number | undefined, fallback: number) => Number.isFinite(value)
  ? Math.max(0, Math.min(1, value!)) : fallback;

function atlas(course: string, index: number, caption: string, objects: string[]): PolishedFrame {
  return { file: `images/chinese-polished/${course}-atlas-v3.webp`, index, columns: 2, rows: 2,
    caption, objects, crop: inset };
}

function single(file: string, caption: string, objects: string[], crop?: PolishedFrame['crop']): PolishedFrame {
  return { file, index: 0, columns: 1, rows: 1, caption, objects, ...(crop ? { crop } : {}) };
}

function campus({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  const index = sceneKey ? ({ lesson: 1, break: 2 } as Record<string, number>)[sceneKey] : phase(step);
  if (index === undefined) return null;
  return atlas('cn-01', index, [
    '大青树下的小学：孩子在石阶前打招呼，校舍、铜钟和竹子在同一校园中。',
    '孩子坐在真实课桌前朗读，窗外小鸟和松鼠安静停在树枝上。',
    '课间，孩子在大青树下跳舞、游戏；小鸟和松鼠在树边看热闹，脚下是同一校园的石地。',
    '校园细节：铜钟吊在木梁上，旁边的竹叶、树干和石阶可以近看。',
  ][index], [
    ['arriving-children', 'banyan-tree', 'village-school'],
    ['reading-children', 'classroom-window', 'quiet-window-animals', 'wooden-desks'],
    ['play-under-tree', 'dancing-children', 'wrestling-children', 'banyan-tree', 'watching-bird', 'watching-squirrel'],
    ['bronze-school-bell', 'phoenix-tail-bamboo', 'school-stone-steps'],
  ][index]);
}

function flowers({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  // A selected colour relation shows the imagined petal clothes, not merely a flower thumbnail.
  const index = sceneKey ? ({ colours: 1, school: 1, opening: 2, sway: 3 } as Record<string, number>)[sceneKey] : phase(step);
  if (index === undefined) return null;
  return atlas('cn-02', index, [
    '雨中的真实花园：白、黄、紫花瓣、雨滴和弯动的花枝可以观察。',
    '文学想象：花孩子在地下学校学习，花瓣的白、黄、紫化作衣裳。',
    '文学想象：雨来了，花孩子穿着花瓣衣裳从地下学校跑到花园里。',
    '文学想象：花孩子把双臂伸向天空；图中没有把天上的妈妈画成真实人物。',
  ][index], index === 0 ? ['real-flower', 'white-yellow-purple-petals', 'rain-bamboo']
    : ['flower-child', 'petal-clothes', ...[
      [], ['underground-flower-school', 'root-desks', 'flower-child-books'],
      ['open-underground-entrance', 'running-flower-children'], ['upward-flower-arms', 'skyward-faces'],
    ][index]]);
}

function question({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  const key = sceneKey === 'overview' ? 'doubt' : sceneKey ?? ['doubt', 'ask', 'understand', 'understand'][phase(step)];
  const index = ({ doubt: 0, ask: 1, recite: 2, understand: 3 } as Record<string, number>)[key];
  if (index === undefined) return null;
  return { ...atlas('cn-03', index, [
    '会背却不懂：孙中山坐在书桌前看书，疑惑的神情与同学的读书动作不同。',
    '请先生解释：孙中山站起来举手，先生和同学转向他。',
    '先生检查背诵：孙中山站着背书，先生手中的戒尺朝下，没有击打动作。',
    '先生耐心讲解，孙中山和同学认真听：开放的书、讲解的手势和人物目光相互联系。',
  ][index], ['sun-yat-sen', 'private-school-teacher', 'listening-classmates', 'wooden-desks',
    ...[['open-book', 'puzzled-child'], ['raised-question-hand', 'open-book'],
      ['closed-book', 'teacher-downward-ruler', 'reciting-child'], ['open-book', 'teacher-explaining']][index]]), sceneKey: key };
}

function dongting({ step, sceneKey, parameter }: SemanticSceneProps): PolishedFrame | null {
  if (sceneKey && !['lake', 'island'].includes(sceneKey)) return null;
  const index = sceneKey ? sceneKey === 'lake' ? 1 : 0 : phase(step);
  const result = atlas('cn-04-wangdongting', index, [
    '洞庭秋夜：银蓝湖面、月光和远处青绿的君山。',
    '潭面无风：细看平静的水面和柔和月影，不把湖面画成白天或波涛。',
    '遥望：湖面宽广，君山在远处显得青绿而小巧。',
    '比喻联想：湖边银盘上的小青螺，与远处湖面和君山对照；银盘青螺不是湖中巨物。',
  ][index], ['lake', 'moon', 'moon-reflection', 'junshan-island',
    ...(index === 1 ? ['still-lake-surface'] : index === 3 ? ['silver-plate-green-snail', 'poetic-comparison-still-life'] : [])]);
  // The parameter changes the observer's view continuously; the island itself is not redrawn or scaled separately.
  if (sceneKey) {
    const distance = bound(parameter, .7);
    const width = 540 + distance * 342;
    const height = width * 2 / 3;
    result.crop = {
      x: Math.min(900 - width - 9, Math.max(9, 610 - width / 2)),
      y: Math.min(600 - height - 6, Math.max(6, 255 - height / 2)), width, height,
    };
  }
  return result;
}

function shanxingComparison({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  if (sceneKey ? !['red-leaf', 'maple', 'spring-flower'].includes(sceneKey) : phase(step) !== 3) return null;
  return single('images/chinese-polished/cn-04-shanxing-comparison-v3.webp',
    '季节对照联想：左侧秋日红枫叶，右侧早春浅粉花。比较红于的颜色关系，不把两个季节说成同一现场。',
    ['red-maple-comparison', 'maple-leaf', 'spring-flower', 'two-season-colour-comparison']);
}

function road({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  const key = sceneKey ?? ['puddle', 'leaf', 'spread', 'footsteps'][phase(step)];
  const source = 'images/chinese-precision/cn-05.webp';
  if (key === 'puddle') return single(source, '真实雨后水洼映出蓝天、树影和金黄落叶。',
    ['puddle-blue-sky-reflection', 'real-rain-road'], { x: 401, y: 230, width: 480, height: 320 });
  if (key === 'leaf') return single(source, '近看原画中的梧桐叶：掌状叶片、叶脉和水滴，平展贴在湿路上。',
    ['sycamore-leaf-closeup', 'five-lobed-sycamore-leaf', 'leaf-veins', 'real-leaf-drops'],
    { x: 20, y: 240, width: 540, height: 360 });
  if (key === 'spread') return single(source, '金黄落叶不规则地铺在整条路上，保留原画真正的叶片和湿路细节。',
    ['irregular-leaf-carpet', 'real-rain-road']);
  if (key === 'footsteps') return single('images/chinese-scenes/cn-05-footsteps.webp',
    '棕红色的小雨靴走在真实金黄落叶上，鞋底、叶片和湿路接触。',
    ['brown-rain-boots', 'irregular-leaf-carpet', 'puddle-blue-sky-reflection']);
  return null;
}

function rain({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  if (!sceneKey && phase(step) === 0) return single('images/chinese-precision/cn-06.webp',
    '秋雨后的乡间小路，女孩、雨伞和果园在原画中。', ['autumn-rain-village', 'child-red-umbrella']);
  if (!sceneKey && phase(step) === 3) return single('images/chinese-polished/cn-06-winter-v3.webp',
    '准备过冬：左侧小松鼠储备松果，右侧小青蛙来到土洞口，两个动物互不遮挡。',
    ['squirrel', 'pine-cone', 'pine-cone-store', 'frog', 'frog-winter-hole']);
  const key = sceneKey ?? ['leaves', 'leaves', 'fruit', 'winter'][phase(step)];
  const index = ({ leaves: 0, fruit: 1, squirrel: 2, frog: 3 } as Record<string, number>)[key];
  if (index === undefined) return null;
  return { file: 'images/chinese-scenes/cn-06-atlas.webp', index, columns: 2, rows: 2, crop: inset,
    caption: ['银杏、枫叶、田野和菊花各有颜色。', '梨和橘子成熟：画面帮助联想，香味仍是闻到的感受。',
      '小松鼠收集松果，树洞和食物储备可以细看。', '小青蛙来到土洞口，叶片、身体和土壤比例自然。'][index],
    objects: [['ginkgo-fan-leaves', 'red-maple-leaves', 'golden-field', 'multicolour-chrysanthemums'],
      ['fruit-tree', 'child-noticing-fruit'], ['squirrel', 'pine-cone', 'pine-cone-store'], ['frog', 'frog-winter-hole']][index] };
}

function sounds({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  const key = sceneKey ?? ['leaves', 'cricket', 'geese', 'details'][phase(step)];
  const index = ({ leaves: 0, cricket: 1, geese: 2, details: 3, soundscape: 3 } as Record<string, number>)[key];
  if (index === undefined) return null;
  // Mixing / pausing keeps this natural scene intact. Small gain indicators are added by the shared renderer.
  return atlas('cn-07', index, ['秋叶在真实树枝与草地之间飘落，细看叶脉和叶柄。',
    '蟋蟀站在草间石面，触角、翅和足在自然环境中，没有乐器或人物化手臂。',
    '大雁在秋日天空中整齐飞行，下方是树林、湖泊和田野。',
    '自然秋声合景：左侧树叶、左下蟋蟀、右上雁群，以及草间小花和谷粒。'][index],
  index === 0 ? ['falling-leaves', 'real-autumn-leaves'] : index === 1 ? ['cricket', 'cricket-balcony', 'cricket-forewings']
    : index === 2 ? ['flying-geese'] : ['falling-leaves', 'cricket', 'cricket-balcony', 'flying-geese', 'flower-and-grain-details']);
}

function tortoise({ step, sceneKey }: SemanticSceneProps): PolishedFrame | null {
  const key = sceneKey ?? ['journey-start', 'spider-warning', 'snail-direction', 'cancelled-wedding'][phase(step)];
  if (key === 'snail-direction') return single('images/chinese-polished/cn-09-direction-v3.webp',
    '陶陶听取蜗牛关于方向的有用提醒；这里只显示已经读到的路口相遇。', ['taotao-turtle', 'snail-direction-reminder', 'forest-fork']);
  const index = ({ 'journey-start': 0, 'spider-warning': 1, 'spider-warning--revealed': 2,
    'cancelled-wedding': 3, 'cancelled-wedding--revealed': 3 } as Record<string, number>)[key];
  if (index === undefined) return null;
  return atlas('cn-09', index, ['陶陶在林间路口开始旅行，图中没有后来的来客或结局。',
    '蜘蛛劝陶陶回家：小蜘蛛停在路边树枝上，陶陶停步听消息；还未显示下一步。',
    '主动揭示后的本处下一步：陶陶继续向前，蜘蛛已留在身后，没有后来的相遇。',
    '壁虎告知新的消息，陶陶停步思考。画面只呈现这次已知相遇，后续留给纸本和自己的续编。'][index],
    ['taotao-turtle', ...[ ['forest-journey-start'], ['spider-warning', 'small-spider-on-twig'],
      ['turtle-continuing', 'spider-left-behind'], ['gecko-news', 'unwritten-travel-continuation'] ][index]]);
}

/** Fine continuous scenes for early lessons; unknown keys remain explicit rather than guessed by a shared numeric step. */
export function getPolishedEarlyFrame(props: SemanticSceneProps): PolishedFrame | null {
  if (props.courseId === 'cn-01') return campus(props);
  if (props.courseId === 'cn-02') return flowers(props);
  if (props.courseId === 'cn-03') return question(props);
  if (props.courseId === 'cn-04' && props.variant === 'wangdongting') return dongting(props);
  if (props.courseId === 'cn-04' && props.variant === 'shanxing') return shanxingComparison(props);
  if (props.courseId === 'cn-05') return road(props);
  if (props.courseId === 'cn-06') return rain(props);
  if (props.courseId === 'cn-07') return sounds(props);
  if (props.courseId === 'cn-09') return tortoise(props);
  return null;
}
