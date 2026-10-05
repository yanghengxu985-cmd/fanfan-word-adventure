import type { SemanticSceneProps } from './ChineseSemanticScene';
import type { PolishedFrame } from './polishedSceneTypes';

const directory = 'images/chinese-polished/';

function frame(name: string, index: number, rows: number, caption: string, objects: string[], crop?: PolishedFrame['crop']): PolishedFrame {
  return { file: `${directory}${name}-atlas-v3.webp`, index, columns: 2, rows, caption, objects, ...(crop ? { crop } : {}) };
}

function sequence(frames: PolishedFrame[], frameDurationMs = 1400): PolishedFrame {
  return { ...frames[0], sequence: { frames, frameDurationMs } };
}

const hongKong = [
  frame('cn-19', 0, 2, '货船、集装箱与码头搬运，商品在港口流通', ['goods-and-cargo-ship', 'dock-worker', 'wooden-cargo-crates', 'harbour-buildings']),
  frame('cn-19', 1, 2, '蒸点、面食与烤制菜肴：不同饮食风味', ['different-cuisines', 'steamed-dim-sum', 'noodle-bowl', 'roast-dish']),
  { file: `${directory}cn-19-sculpture-atlas-v3.webp`, index: 0, columns: 1, rows: 1, caption: '海港旁的金紫荆雕塑：卷曲花瓣、中央结构与红色花岗岩台座', objects: ['golden-bauhinia-sculpture', 'golden-bauhinia-pedestal', 'harbour-buildings'] },
  frame('cn-19', 3, 2, '港湾夜景：建筑灯光、渡船与水中倒影', ['lit-harbour-skyline', 'harbour-night-ferry', 'harbour-light-reflections']),
];

const natureSounds = [
  frame('cn-21', 0, 3, '同一自然景色中的树叶、溪流、鸟与草边的蟋蟀', ['wind-leaf-object', 'water-stream', 'bird-and-cricket']),
  frame('cn-21', 1, 3, '风吹动树叶和草叶，溪水仍在林间流动', ['wind-leaf-object', 'active-wind', 'water-stream']),
  frame('cn-21', 2, 3, '雨滴落在叶面和溪水上，水珠与雨圈都可近看', ['rain-struck-leaf', 'active-rain', 'rain-impact-ripples', 'water-stream', 'bird-and-cricket']),
  frame('cn-21', 3, 3, '从眼前小溪望向河流，再向开阔的大海看去', ['water-stream', 'stream-river-sea-progression', 'small-stream-example', 'river-example', 'sea-example']),
  frame('cn-21', 4, 3, '枝头的鸟与草叶上的蟋蟀，一起构成动物声部', ['bird-and-cricket', 'singing-birds', 'singing-cricket', 'water-stream']),
  frame('cn-21', 5, 3, '风吹树叶、雨落叶面、溪水流动，鸟与蟋蟀也在同一声景中', ['wind-leaf-object', 'active-wind', 'rain-struck-leaf', 'active-rain', 'rain-impact-ripples', 'water-stream', 'bird-and-cricket', 'singing-birds', 'singing-cricket']),
];

const natureBook = [
  frame('cn-22', 0, 3, '近处麻雀蹦跳觅食，远处老鹰展翅滑翔', ['sparrow-hopping-observation', 'eagle-flight-observation']),
  frame('cn-22', 1, 3, '蚂蚁沿着土路活动，身体、触角与足都可以观察', ['ant-observation', 'ordered-ant-group']),
  frame('cn-22', 2, 3, '不同花朵、叶形与草叶；果树枝头还在开花', ['plant-colours-and-shapes', 'grass-leaf-differences', 'flowering-branch'], { x: 11.25, y: 0, width: 877.5, height: 585 }),
  frame('cn-22', 3, 3, '同一果树枝头后来结出果实，花与果不是同一时刻', ['plant-colours-and-shapes', 'fruit-tree-blossom-to-fruit', 'fruiting-branch', 'fruit-after-blossom', 'grass-leaf-differences'], { x: 11.25, y: 0, width: 877.5, height: 585 }),
  frame('cn-22', 4, 3, '竹子的节与狭长叶，棕榈的扇形叶与池中倒影', ['bamboo-growth-and-leaves', 'palm-fronds-and-reflection']),
  frame('cn-22', 5, 3, '近看竹节、叶片形状与水中倒影', ['bamboo-growth-and-leaves', 'palm-fronds-and-reflection']),
];

const study = [
  frame('cn-24', 0, 3, '面对尚未弄懂的几何问题，先看清学习困难', ['student-facing-study-difficulty', 'study-book-and-geometric-work', 'study-difficulty-action-result']),
  frame('cn-24', 1, 3, '利用早晚时间读书，持续改善薄弱的基础', ['student-studying-under-streetlight', 'open-book', 'study-difficulty-action-result']),
  frame('cn-24', 2, 3, '能够独立完成几何练习，学习取得进步', ['student-working-with-compass', 'study-book-and-geometric-work', 'study-difficulty-action-result']),
  frame('cn-24', 3, 3, '实验难题还未解决：观察材料与仪器，思考怎样继续', ['experiment-difficulty-before-action', 'observation-instrument-schematic', 'observation-workbench', 'experiment-difficulty-action-result']),
  frame('cn-24', 4, 3, '眼睛贴近目镜、手调仪器，认真反复观察', ['experiment-observation-not-specific-procedure', 'scientist-observing-through-eyepiece', 'scientist-eye-at-eyepiece', 'scientist-adjusting-instrument', 'observation-workbench', 'experiment-difficulty-action-result']),
  frame('cn-24', 5, 3, '记录观察结果，实验取得进展；具体实验仍请对照纸本', ['experiment-observation-not-specific-procedure', 'scientist-recording-observation', 'pen-on-observation-page', 'observation-notebook', 'observation-workbench', 'experiment-difficulty-action-result']),
];

const medical = [
  frame('cn-25', 0, 2, '白求恩与护士在救护帐篷内为伤员工作', ['field-medical-tent', 'covered-patient-and-operating-table', 'doctor-and-assistant-working-together', 'doctor-hands-at-covered-table', 'assistant-hands-at-covered-table']),
  frame('cn-25', 1, 2, '外面烟雾逼近，两名医护仍专注于伤员', ['field-medical-tent', 'smoke-outside-tent', 'covered-patient-and-operating-table', 'doctor-and-assistant-working-together', 'doctor-hands-at-covered-table', 'assistant-hands-at-covered-table']),
  frame('cn-25', 2, 2, '来人转达撤离决定，白求恩转头听取，仍守在伤员旁', ['field-medical-tent', 'smoke-outside-tent', 'messenger-proposes-leaving', 'covered-patient-and-operating-table', 'doctor-and-assistant-working-together']),
  frame('cn-25', 3, 2, '白求恩俯身继续工作，护士把纱布递到实际工作位置', ['field-medical-tent', 'covered-patient-and-operating-table', 'doctor-and-assistant-working-together', 'doctor-leaning-toward-covered-table', 'doctor-hands-at-covered-table', 'assistant-hands-at-covered-table']),
];

const bowl = [
  frame('cn-26', 0, 3, '粗瓷大碗的釉面、斑点与磨损细节', ['new-rough-porcelain-bowl', 'rough-ceramic-bowl']),
  frame('cn-26', 1, 3, '赵一曼把原有用具交给新战士，此时还没有这只粗瓷碗', ['old-utensil', 'zhao-yiman', 'new-soldier-receiving-utensil']),
  frame('cn-26', 2, 3, '男通讯员找来粗瓷碗并盛饭，赵一曼接住同一只碗', ['new-rough-porcelain-bowl', 'rough-bowl-with-rice', 'zhao-yiman', 'male-messenger'], { x: 22.5, y: 0, width: 855, height: 570 }),
  frame('cn-26', 3, 3, '赵一曼双手扶碗，把米饭倒回锅里', ['new-rough-porcelain-bowl', 'rough-bowl-with-rice', 'rice-returned-to-pot', 'zhao-yiman', 'hands-contact-bowl'], { x: 22.5, y: 0, width: 855, height: 570 }),
  frame('cn-26', 4, 3, '米饭留在锅里，赵一曼自己换成野菜粥', ['new-rough-porcelain-bowl', 'wild-greens-porridge', 'rice-returned-to-pot', 'zhao-yiman']),
  frame('cn-26', 5, 3, '同一只粗瓷大碗盛菜，给七班战士共同使用', ['new-rough-porcelain-bowl', 'seventh-squad-dish-bowl', 'shared-seventh-squad-table', 'zhao-yiman', 'soldiers-sharing-vegetables']),
];

function preservedJar(index: number, caption: string, objects: string[]): PolishedFrame {
  return { file: 'images/chinese-scenes/cn-23-atlas.webp', index, columns: 2, rows: 3, caption, objects: ['water-jar', ...objects] };
}

function jarTransitions(key: string): PolishedFrame | null {
  if (key === 'fall' || key === 'falling') {
    return sequence([
      frame('cn-23-transition', 0, 2, '登瓮：孩子手扶瓮沿、脚踏石块，向上攀登', ['water-jar', 'climbing-child', 'children-watching']),
      frame('cn-23-transition', 1, 2, '足跌：孩子脚下失去支撑，身体向瓮内倾倒', ['water-jar', 'slipping-child', 'children-watching']),
      preservedJar(0, '没水中：孩子落进了水瓮里，此时瓮还没有打破', ['child-in-jar']),
    ]);
  }
  if (key === 'saved' || key === 'saving') {
    return sequence([
      preservedJar(4, '水迸：水从瓮壁破口涌出', ['broken-jar', 'flowing-water', 'child-in-jar']),
      frame('cn-23-transition', 2, 2, '瓮内水位退下，孩子扶着边沿准备离开', ['broken-jar', 'flowing-water', 'child-in-jar', 'retreating-water']),
      frame('cn-23-transition', 3, 2, '孩子跨出瓮壁破口，湿衣袖与衣角仍滴着水', ['broken-jar', 'child-climbing-out', 'wet-clothes-water-drops', 'rescuer-supporting-wrist']),
      { file: `${directory}cn-23-saved-atlas-v3.webp`, index: 0, columns: 1, rows: 1, caption: '儿得活：同一个孩子双脚站稳在瓮外，湿衣仍滴水；同一处大破口就在身后', objects: ['water-jar', 'broken-jar', 'rescued-child', 'wet-clothes-water-drops', 'rescuer-supporting-wrist'] },
    ]);
  }
  // Existing painted play, leaving, stone strike, water flow and reference frames remain intact.
  return null;
}

function poemFrame({ variant, step, sceneKey, parameter }: SemanticSceneProps): PolishedFrame | null {
  if (variant === 'luchai') return null;
  if (variant === 'wangtianmenshan') {
    const amount = Number.isFinite(parameter) ? Math.max(0, Math.min(1, parameter!)) : .45;
    const index = sceneKey === 'river' || sceneKey === 'mountains'
      ? Math.min(3, Math.floor(amount * 4)) : [0, 1, 2, 0][Math.max(0, Math.min(3, step))];
    const focus = sceneKey === 'river' ? { x: 50 + amount * 16, y: 83 + amount * 16, width: 800, height: 500 }
      : sceneKey === 'mountains' ? { x: 10 + amount * 10, y: 8, width: 870, height: 560 } : undefined;
    return frame('tianmen', index, 2, sceneKey === 'mountains'
      ? '行舟位置变化，两岸青山与船的相对位置随视点改变'
      : sceneKey === 'river' ? '山间江流与行舟位置一起观察，山体仍在两岸'
        : ['江水穿过两岸山峰，河道向远处展开', '碧水在山间流动，波纹与转折清晰可见', '行舟时，两岸青山从不同视点显现', '日边远帆：远处船帆与太阳的位置联系起来看'][step],
    ['fixed-left-bank', 'fixed-right-bank', 'observer-boat', 'observer-position', 'sail', 'river-channel', 'green-mountain-cliffs'], focus);
  }
  if (variant === 'yinhushang') {
    const sunny = frame('westlake', 0, 2, '晴天水光潋滟：真实水纹与阳光倒影', ['sunny-water-glitter', 'westlake-hills', 'same-lakeside-pavilion', 'same-lakeside-girl']);
    const rainy = frame('westlake', 1, 2, '雨中山色空蒙：同一西湖的远山隐在雨雾中', ['rainy-westlake', 'rainy-mountain-mist', 'same-lakeside-pavilion', 'same-lakeside-girl']);
    const light = frame('westlake', 2, 2, '淡：柔和浅淡的湖山景色，细节仍完整', ['light-and-rich-colour-comparison', 'soft-westlake-colour', 'same-lakeside-pavilion', 'same-lakeside-girl']);
    const rich = frame('westlake', 3, 2, '浓：明亮浓郁的湖山色彩，仍是同一片景色', ['light-and-rich-colour-comparison', 'rich-westlake-colour', 'same-lakeside-pavilion', 'same-lakeside-girl']);
    if (sceneKey === 'sunny') return sunny;
    if (sceneKey === 'rainy') return rainy;
    return step === 0 ? sunny : step === 1 ? rainy : step === 2 ? sequence([sunny, rainy], 1800) : sequence([light, rich], 1800);
  }
  return null;
}

/** The selected object/action chooses a painted frame; source pixels are never edited by rendering. */
export function getPolishedLateFrame(props: SemanticSceneProps): PolishedFrame | null {
  const { courseId, step, sceneKey, gains } = props;
  const read = Math.max(0, Math.min(3, Math.floor(step)));
  if (courseId === 'cn-19') return hongKong[({ goods: 0, dishes: 1, sculpture: 2, lights: 3 } as Record<string, number>)[sceneKey ?? ''] ?? read];
  if (courseId === 'cn-20') return poemFrame(props);
  if (courseId === 'cn-21') {
    if (gains) {
      const enabled = ['wind', 'rain', 'water', 'animals'].filter(key => (gains[key] ?? 0) > 0);
      return natureSounds[enabled.length > 1 ? 5 : ({ wind: 1, rain: 2, water: 3, animals: 4 } as Record<string, number>)[enabled[0]] ?? 0];
    }
    return natureSounds[({ wind: 1, rain: 2, water: 3, animals: 4 } as Record<string, number>)[sceneKey ?? ''] ?? [0, 1, 3, 4][read]];
  }
  if (courseId === 'cn-22') {
    if (sceneKey === 'plant' || (!sceneKey && read === 2)) return sequence([natureBook[2], natureBook[3]], 1800);
    return natureBook[({ bird: 0, insect: 1, plant: 2 } as Record<string, number>)[sceneKey ?? ''] ?? [0, 1, 2, 4][read]];
  }
  if (courseId === 'cn-23') return jarTransitions(sceneKey ?? ['play', 'fall', 'leave', 'hold-stone'][read]);
  if (courseId === 'cn-24') return study[({ 'study-difficulty': 0, 'study-hard': 1, 'study-result': 2, 'experiment-difficulty': 3, 'experiment-hard': 4, 'experiment-result': 5 } as Record<string, number>)[sceneKey ?? ''] ?? [0, 1, 4, 5][read]];
  if (courseId === 'cn-25') return medical[({ patients: 0, danger: 1, suggestion: 2, continue: 3 } as Record<string, number>)[sceneKey ?? ''] ?? read];
  if (courseId === 'cn-26') {
    if (sceneKey === 'rice' || (!sceneKey && read === 2)) return sequence([bowl[3], bowl[4]], 1800);
    return bowl[({ exhibit: 0, 'old-utensil': 1, 'new-bowl': 2, rice: 3, dish: 5 } as Record<string, number>)[sceneKey ?? ''] ?? [0, 2, 3, 5][read]];
  }
  return null;
}
