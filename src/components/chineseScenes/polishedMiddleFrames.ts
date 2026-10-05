import type { SemanticSceneProps } from './ChineseSemanticScene';
import type { PolishedFrame } from './polishedSceneTypes';

const cellInset = { x: 9, y: 6, width: 882, height: 588 };
const defaults: Record<string, string[]> = {
  'cn-10': ['learn-call', 'learning-rooster', 'learning-bird', 'ending-gate'],
  'cn-11': ['grandma', 'peach', 'math', 'sunflower'],
  'cn-12': ['mouth', 'first', 'mouth-again', 'outside'],
  'cn-13': ['carry', 'tempted', 'call-back', 'smallest'],
  'cn-16': ['water', 'coral', 'fish', 'birds'],
  'cn-17': ['coast', 'trees', 'shade', 'clean'],
};

function frame(courseId: string, index: number, rows: number, caption: string, objects: string[]): PolishedFrame {
  return {
    file: `images/chinese-polished/${courseId}-atlas-v3.webp`,
    index, columns: 2, rows, caption, objects,
    // Exclude thin generated contact-sheet dividers only at render time.
    crop: cellInset,
  };
}

function dogFrame(index: number, caption: string, objects: string[]): PolishedFrame {
  const result = frame('cn-10', index, 3, caption, objects);
  // The generated sheet's dividers are at source y=392..396 and 775..779,
  // rather than equal thirds. Crop within each virtual cell to keep the
  // selected painting isolated without editing source pixels or leaking
  // the following prediction scene into the bottom edge.
  result.crop = index < 2 ? { x: 30, y: 0, width: 840, height: 560 }
    : index < 4 ? { x: 69, y: 0, width: 762, height: 508 } : cellInset;
  return result;
}

function puppy(key: string): PolishedFrame | null {
  const revealed = key.endsWith('--revealed');
  const base = key.replace(/--revealed$/, '');
  const dog = ['learning-dog'];
  if (base === 'learn-call' && !revealed) return dogFrame(0,
    '小狗想学会叫。当前只呈现已经读到的困难，不透露后来来客。', [...dog, 'wish-to-learn-call']);
  if (base === 'learning-rooster' || (base === 'learn-call' && revealed)) return dogFrame(1,
    '小狗听公鸡叫，再尝试学习；公鸡羽毛、张开的喙与站立动作可以观察。', [...dog, 'rooster-teaching-call']);
  if (base === 'learning-bird') return dogFrame(2,
    '小狗抬头听杜鹃的叫声，鸟爪握住树枝。这里只呈现这一次学习。', [...dog, 'bird-teaching-call']);
  if (base === 'ending-gate' && !revealed) return dogFrame(3,
    '停在结局入口之前：小狗面对分岔路。画面不展示未知来客或结局线索。', [...dog, 'unrevealed-ending-paths']);
  if (base === 'ending-gate' && revealed) return dogFrame(4,
    '三条纸本结局入口：小母牛、农民、听到汪汪声。这里只给阅读线索，没有补写完整结局。',
    [...dog, 'revealed-ending-entrances', 'cow-ending-entrance', 'farmer-ending-entrance', 'dog-call-ending-entrance']);
  return null;
}

function gourd(key: string): PolishedFrame | null {
  const imagined = ['imagined-gourd'];
  const scenes: Record<string, [number, string, string[]]> = {
    grandma: [0, '奶奶讲故事，王葆认真听；云形想象区中的宝葫芦不是现实中已经得到的物品。',
      ['grandmother-storyteller', 'gray-hair-bun', 'child-listening-to-grandmother', 'grandmother-story-imagination', ...imagined]],
    peach: [1, '奶奶故事里的桃子和宝葫芦只在云形想象区出现，讲述和已经发生的生活保持区分。',
      ['grandmother-storyteller', 'gray-hair-bun', 'child-listening-to-grandmother', 'grandmother-story-imagination', 'imagined-peach', ...imagined]],
    math: [2, '算术难题让王葆烦恼；想象宝葫芦并不表示难题已经被魔法解决。',
      ['arithmetic-book', 'wangbao-wish-imagination', ...imagined]],
    sunflower: [3, '王葆查看长得不好的向日葵：弯曲的茎、下垂的叶子与低垂的花头。宝葫芦只在想象区。',
      ['poorly-growing-sunflower', 'weak-bent-sunflower-stem', 'drooping-sunflower-leaves', 'drooping-sunflower-head', 'wangbao-wish-imagination', ...imagined]],
  };
  const scene = scenes[key];
  return scene ? frame('cn-11', scene[0], 2, scene[1], scene[2]) : null;
}

function crickets(key: string): PolishedFrame | null {
  const scenes: Record<string, [number, string, string[]]> = {
    grass: [0, '红头与青头在青草间；红色与绿色的头部标记帮助追踪两位伙伴。',
      ['grass-at-hiding-place']],
    mouth: [1, '红头随着青草进入牛嘴，青头仍在牛嘴外。观察青草、牛嘴与伙伴的位置。',
      ['cow-mouth', 'carried-with-grass']],
    first: [2, '第一个胃的情节位置想象：红头随草移动；分开的外部小景中青头提醒它。此图不是器官解剖图。',
      ['first-stomach-story-space', 'carried-with-grass', 'outside-green-cricket-inset']],
    second: [3, '第二个胃的情节位置想象：红头仍随草移动；青头在牛体外的小景中。此图不模拟科学解剖。',
      ['second-stomach-story-space', 'carried-with-grass', 'outside-green-cricket-inset']],
    'mouth-again': [4, '红头返回嘴边但还不能脱险；青头在牛的鼻孔附近准备帮助。牛嘴和鼻孔位置不同。',
      ['cow-mouth', 'carried-with-grass', 'green-cricket-at-nostril']],
    outside: [5, '青头在鼻孔处帮助牛打喷嚏，红头随青草脱离牛嘴。这是故事中的脱险动作。',
      ['grass-outside-mouth', 'sneeze-and-escape', 'green-cricket-at-nostril']],
  };
  const scene = scenes[key === 'overview' ? 'grass' : key];
  return scene ? frame('cn-12', scene[0], 3, scene[1],
    ['red-cricket', 'green-cricket', 'current-red-cricket-location', ...scene[2]]) : null;
}

function ants(key: string): PolishedFrame | null {
  const scenes: Record<string, [number, string, string[]]> = {
    carry: [0, '伙伴们共同搬运奶酪，脚踩地面，身体与前足支撑奶酪；队长走在前面。',
      ['team-carrying-cheese']],
    tempted: [1, '队长很想吃眼前的奶酪渣，但口器没有碰到渣。念头和实际吃掉的动作不同。',
      ['cheese-crumb', 'thought-not-action']],
    'call-back': [2, '队长把伙伴叫回来，面对伙伴指向地面的奶酪渣，公开处理。',
      ['cheese-crumb', 'partners-called-back']],
    smallest: [3, '最小的蚂蚁用口器接触并吃奶酪渣，队长在旁看着；不是把奶酪放在背上。',
      ['cheese-crumb', 'smallest-ant', 'partners-called-back', 'smallest-ant-eating-crumb']],
  };
  const scene = scenes[key];
  return scene ? frame('cn-13', scene[0], 2, scene[1], ['ant-captain', 'cheese-block', ...scene[2]]) : null;
}

function islands(key: string): PolishedFrame | null {
  const scenes: Record<string, [number, string, string[]]> = {
    water: [0, '浅水透出沙底，礁区青蓝，远处深海呈深蓝。深浅色带沿自然海岸变化。',
      ['shallow-turquoise-water', 'middle-blue-water', 'deep-indigo-water', 'island']],
    coral: [1, '海底可以分清鹿角状枝珊瑚和层叠盘状珊瑚，海参与龙虾生活在沙底。',
      ['branching-coral', 'rounded-coral', 'layered-plate-coral', 'sea-cucumber', 'lobster', 'undersea-context-fish']],
    fish: [2, '条纹、长形、斑点与圆形的鱼有不同身体和鳍尾；近处清楚，远处成群。',
      ['many-different-fish', 'reef-fish']],
    birds: [3, '独立的陆地鸟岛：鸟爪握住树枝，鸟巢承在枝杈上，巢内鸟蛋可见。海只在岸外背景。',
      ['bird-nest-with-eggs', 'island-birds']],
  };
  const scene = scenes[key];
  return scene ? frame('cn-16', scene[0], 2, scene[1], scene[2]) : null;
}

function town(key: string): PolishedFrame | null {
  const scenes: Record<string, [number, string, string[]]> = {
    coast: [0, '海边沙滩上有贝壳，渔船驶向同一座小城的港湾。',
      ['returning-fishing-boats', 'shells-on-beach']],
    trees: [1, '同一小城的庭院：椰树、桉树、橄榄树与凤凰树形态有别，枝上花叶与真实树干相连。',
      ['courtyard-varied-trees', 'courtyard-flower-blossoms', 'fragrant-courtyard-leaves']],
    shade: [2, '公园里榕树浓密宽阔，树冠与气根形成真实阴影；人在树下长椅休息。',
      ['banyan-wide-canopy', 'banyan-shade', 'people-resting-in-shade']],
    clean: [3, '开阔整洁的小城街道，细沙路面和两侧房屋透视连贯，路上没有垃圾落叶。',
      ['clean-open-street', 'street-road-surface', 'street-side-planters']],
  };
  const scene = scenes[key];
  if (!scene) return null;
  const result = frame('cn-17', scene[0], 2, scene[1], scene[2]);
  // The road material was separately corrected to fine sand; retain the
  // already reviewed original artwork for coast, courtyard and park.
  if (key === 'clean') result.file = 'images/chinese-polished/cn-17-atlas-v4.webp';
  return result;
}

/** Preserve the existing fine seasonal panorama; only the winter tool gets a closer animal view. */
function winterObservation(props: SemanticSceneProps): PolishedFrame | null {
  if (props.sceneKey !== 'winter') return null;
  return {
    file: 'images/chinese-scenes/cn-18-atlas.webp',
    index: 3, columns: 2, rows: 2,
    caption: '冬季局部观察：熊在洞中休息，紫貂在洞外，松鼠抱着松果。全景阅读仍保留原来的四季森林。',
    objects: ['winter-snow', 'squirrel', 'pine-cone', 'sable', 'bear-winter-den', 'same-forest-trees'],
    crop: { x: 0, y: 210, width: 570, height: 380 },
  };
}

export function getPolishedMiddleFrame(props: SemanticSceneProps): PolishedFrame | null {
  if (props.courseId === 'cn-18') return winterObservation(props);
  const options = defaults[props.courseId];
  if (!options) return null;
  const position = Number.isFinite(props.step) ? Math.max(0, Math.min(3, Math.floor(props.step))) : 0;
  const key = props.sceneKey || options[position];
  switch (props.courseId) {
    case 'cn-10': return puppy(key);
    case 'cn-11': return gourd(key);
    case 'cn-12': return crickets(key);
    case 'cn-13': return ants(key);
    case 'cn-16': return islands(key);
    case 'cn-17': return town(key);
    default: return null;
  }
}
