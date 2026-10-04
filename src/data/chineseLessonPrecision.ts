import { lessonCourseById, lessonMaterialById } from './chineseLessons';

export type PrecisionSceneOption = {
  id: string; label: string; artStep: number; artVariant?: string;
  caption: string; evidence: string; marks?: PrecisionMark[];
};
export type PrecisionMark = {
  id: string; label: string; x: number; y: number;
  shape: 'spot' | 'leaf' | 'wave' | 'light' | 'arrow' | 'node';
};
type ToolBase = { id: string; title: string; instruction: string; question: string; teacherHint: string };
export type PrecisionCompareTool = ToolBase & {
  kind: 'compare'; options: PrecisionSceneOption[];
  parameter?: { id: string; label: string; min: number; max: number; initial: number; effect: 'distance' | 'speed' | 'light' | 'rain' | 'colour' };
};
export type PrecisionHotspotTool = ToolBase & {
  kind: 'hotspot'; artStep: number; artVariant?: string;
  spots: { id: string; label: string; x: number; y: number; zoom: number; clue: string; meaning: string }[];
};
export type PrecisionAssociationTool = ToolBase & {
  kind: 'association'; artStep: number; artVariant?: string;
  sources: { id: string; text: string; artStep?: number }[];
  targets: { id: string; text: string }[];
  relations: { sourceId: string; targetId: string; explanation: string }[];
  feedback: string;
};
export type PrecisionRouteTool = ToolBase & {
  kind: 'route';
  nodes: { id: string; label: string; artStep: number; meaning: string }[];
  expectedOrder: string[]; explanation: string;
  routeNote: string;
};
export type PrecisionPredictionTool = ToolBase & {
  kind: 'prediction';
  stops: {
    id: string; title: string; artStep: number; known: string;
    evidence: { id: string; text: string }[];
    predictions: { id: string; text: string; basisIds: string[] }[];
    outcome?: string; outcomeNote: string;
  }[];
};
export type PrecisionSoundTool = ToolBase & {
  kind: 'sound';
  layers: {
    id: string; label: string; artStep: number; clue: string; soundHint: string;
    pattern: 'wind' | 'rain' | 'stream' | 'bird' | 'insect';
    x: number; y: number; initial: number;
  }[];
  contrast: string; simulationNote: string;
};
export type PrecisionClassicalTool = ToolBase & {
  kind: 'classical';
  lines: { id: string; text: string; chunks: string[]; alternativeChunks?: string[][]; meaning: string; artStep: number; actionId: string }[];
  actions: { id: string; text: string; artStep: number }[];
  refs?: { id: string; word: string; lineId: string; question: string; targets: { id: string; text: string; artStep: number; explanation: string }[]; targetId: string }[];
  explanation: string;
};
export type PrecisionTool = PrecisionCompareTool | PrecisionHotspotTool | PrecisionAssociationTool | PrecisionRouteTool | PrecisionPredictionTool | PrecisionSoundTool | PrecisionClassicalTool;
export type PrecisionLesson = {
  courseId: string; type: 'scene' | 'observe' | 'story' | 'poem' | 'landscape' | 'sound' | 'classical';
  title: string; goal: string; tools: PrecisionTool[];
  teacherPrompts: string[];
  paperTask: { title: string; prompts: string[]; optional: true; note: string };
  sourceNote: string;
};

const boundary = '本工具为原创阅读辅导，情节概述与释义请对照2026纸本；不冒充教材原句，不增加未核验的必考、必背、必默或必写要求。认字、写字和词语复用既有教材词库。';

function base(id: string, title: string, instruction: string, question: string, teacherHint: string): ToolBase {
  return { id, title, instruction, question, teacherHint };
}
function lesson(courseId: string, type: PrecisionLesson['type'], goal: string, tools: PrecisionTool[], paper: string[], note = ''): PrecisionLesson {
  return { courseId, type, title: lessonCourseById.get(courseId)?.title ?? courseId, goal, tools,
    teacherPrompts: tools.map(tool => tool.teacherHint),
    paperTask: { title: '把理解留在纸上', prompts: paper, optional: true, note: '这张阅读记录纸可选做，不替代课本字词书写或增加背默任务。' },
    sourceNote: `${boundary}${note}` };
}
const mark = (id: string, label: string, x: number, y: number, shape: PrecisionMark['shape']): PrecisionMark => ({ id, label, x, y, shape });

export const chinesePrecisionLessons: PrecisionLesson[] = [
  lesson('cn-01', 'scene', '比较上课与课间的动静，给校园特点找到看得见、听得见的依据。', [{
    ...base('campus-contrast', '校园的两种节奏', '直接切换上课与课间，观察人物动作和窗外声源怎样变化。', '为什么写窗外安静，反而让教室里的朗读更突出？', '把画面中的一个变化连回纸本语句；动物像听众是作者的想象，不是动物懂得读书的科学事实。'),
    kind: 'compare', options: [
      { id: 'lesson', label: '上课：声与静', artStep: 1, caption: '教室里有读书声，窗外的动物仿佛静静听着。', evidence: '声音与安静形成对照，让朗读情景更突出。', marks: [mark('reading', '读书声', 48, 48, 'wave'), mark('listening', '窗外安静', 83, 49, 'spot')] },
      { id: 'break', label: '课间：动与乐', artStep: 2, caption: '孩子在树下游戏，动物仿佛来看热闹。', evidence: '相同的校园换了活动，人物和动物表现也随之变化。', marks: [mark('play', '游戏动作', 47, 77, 'arrow'), mark('tree', '树下活动', 24, 66, 'spot')] },
    ],
  }], ['选一处上课细节和一处下课细节，用“上课时……下课时……”说清变化。']),

  lesson('cn-02', 'scene', '把自然中的花与花孩子的想象对应，理解新鲜表达依托了什么特点。', [{
    ...base('flowers-imagination-links', '花与花孩子，找出联系', '点一张自然卡，再点对应的想象卡，连线会保留你的选择。', '作者的想象为什么有趣，又能让我们想到真实的花？', '追问两边相似的特点；明确地下学校、天上的妈妈是文学想象。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'colours', text: '花瓣有不同的颜色', artStep: 0 }, { id: 'opening', text: '雨后花朵开放', artStep: 2 }, { id: 'sway', text: '花枝向上伸展、随风摇动', artStep: 3 }],
    targets: [{ id: 'clothes', text: '孩子穿不同颜色的衣裳' }, { id: 'holiday', text: '孩子放假后从学校出来' }, { id: 'arms', text: '花孩子伸手、跳舞' }],
    relations: [{ sourceId: 'colours', targetId: 'clothes', explanation: '花色对应彩色衣裳。' }, { sourceId: 'opening', targetId: 'holiday', explanation: '开放与走出学校共享出来的画面。' }, { sourceId: 'sway', targetId: 'arms', explanation: '花枝的姿态与孩子的动作相似。' }],
    feedback: '先找颜色、开放或姿态的共同点，不把想象当作花朵真的上学。',
  }], ['选一组联系：看见的花是什么样，作者把它想成什么？']),

  lesson('cn-03', 'story', '把提问的原因、行动与课堂变化连成事件路线，分清会背与理解。', [{
    ...base('question-change-route', '一次提问怎样改变课堂', '按事情发展把事件放入路线；点已放入的卡可以移去。画面跟随最后一张卡。', '孙中山已经会背书，为什么还要提问？', '从“不懂意思”讲起，再用先生前后动作说明变化；略读重在自主阅读与口头交流。'),
    kind: 'route', nodes: [
      { id: 'ask', label: '请先生解释', artStep: 1, meaning: '提问是为了弄懂书中的意思。' },
      { id: 'understand', label: '先生讲解，大家听', artStep: 2, meaning: '课堂开始回应学生对意思的疑问。' },
      { id: 'doubt', label: '会背，但不懂', artStep: 0, meaning: '背出文字和理解内容是不同的事情。' },
      { id: 'recite', label: '按要求背出功课', artStep: 1, meaning: '背书检查证明他的疑问不在是否会背。' },
    ], expectedOrder: ['doubt', 'ask', 'recite', 'understand'], explanation: '先有不懂的疑问，再提问；先生检查后讲解。', routeNote: '用事件节点说明课堂改变，不把大声背书等同于理解。',
  }], ['口头复述“因为……于是……后来……”，阅读记录可选，不新增略读课必写字。'], '本课为略读，不新增必写、必背或必默任务。'),

  lesson('cn-04', 'poem', '三首秋诗分别用远近、颜色与听看关系理解诗意，原文与拼音沿用既有公版诗。', [
    {
      ...base('wangdongting-distance', '远望，山为什么像青螺', '拖动远近示意，观察湖中山在画面里的大小；再点湖面或君山。', '银盘、青螺是实物还是比喻？远望怎样帮助这个比喻？', '联系“遥望”和“翠”解释大小与颜色；示意只改变观察画面，不声称实际山体在缩小。'),
      kind: 'compare', parameter: { id: 'distance', label: '观察远近示意', min: 0, max: 100, initial: 70, effect: 'distance' },
      options: [{ id: 'lake', label: '看湖面', artStep: 0, artVariant: 'wangdongting', caption: '月光下平静的湖面，给诗人镜子和银盘的联想。', evidence: '“潭面无风”说明平静，“白银盘”是对湖面的比喻。', marks: [mark('lake', '湖面', 50, 67, 'wave')] }, { id: 'island', label: '看远山', artStep: 1, artVariant: 'wangdongting', caption: '远处青绿的君山在湖面中显得小。', evidence: '“遥望”说明距离；青绿色和小巧形状帮助理解青螺。', marks: [mark('island', '君山', 65, 35, 'spot')] }],
    },
    {
      ...base('shanxing-scene-clues', '沿石径找到停车的理由', '点画面上的景物，再回诗句找对应词。', '“坐爱”为什么不能解释成坐着喜欢？', '前景后景共同构成山行画面；“坐”解释为因为，别让景物点读替代整句理解。'),
      kind: 'hotspot', artStep: 0, artVariant: 'shanxing', spots: [
        { id: 'path', label: '石径', x: 36, y: 71, zoom: 1.65, clue: '石路向秋山上延伸。', meaning: '联系“远上、斜”，读出向上走的山路。' },
        { id: 'houses', label: '白云与人家', x: 69, y: 43, zoom: 1.8, clue: '白云升起的地方有人家。', meaning: '教材诗句沿用“白云生处”；看全句，不把生混写成深。' },
        { id: 'maple', label: '霜叶', x: 20, y: 22, zoom: 1.6, clue: '傍晚的红叶让诗人停下车来欣赏。', meaning: '后两句连出原因与比较：“坐”是因为，“红于”是比……更红。' },
      ],
    },
    {
      ...base('yeshusuojian-hear-see', '秋夜：听见、看见与想到', '将已经听见或看见的内容，连到相应的理解。', '篱边灯光怎样让诗人想到儿童？', '分清所见灯光与由灯光推想到的活动；不要把诗人写成正在捉蟋蟀的人。'),
      kind: 'association', artStep: 0, artVariant: 'yeshusuojian',
      sources: [{ id: 'wind', text: '梧叶声、江上秋风' }, { id: 'lamp', text: '深夜篱边的一点灯光' }],
      targets: [{ id: 'feeling', text: '秋风触动客居者的情感' }, { id: 'children', text: '想到儿童在挑促织' }],
      relations: [{ sourceId: 'wind', targetId: 'feeling', explanation: '前两句把秋声和客情相连。' }, { sourceId: 'lamp', targetId: 'children', explanation: '诗人由所见灯光联想到儿童活动。' }], feedback: '听、看和想到的内容有联系，但并非同一种信息。',
    },
  ], ['任选一首，把一句诗和一种景物联系起来；背默范围沿用已核课后要求，不由本工具另行增加。'], '六首诗的原文和分字拼音复用现有公版诗材料；本工具不重写教材背默清单。'),

  lesson('cn-05', 'observe', '用颜色、形状和上下文读懂落叶与路面的表达。', [{
    ...base('road-detail-lens', '雨后小路的观察镜头', '点雨后水洼、叶子或路面，局部镜头与词义提示同步改变。', '理解“熨帖”或“凌乱”，你用了哪一处邻近描写？', '让孩子先用自己的话解释，再把词义放回原句检查；点看细节只是理解的支架。'),
    kind: 'hotspot', artStep: 1, spots: [
      { id: 'puddle', label: '水洼', x: 70, y: 63, zoom: 1.8, clue: '雨后水面映出蓝天，和放晴的天空联系起来。', meaning: '理解明朗时联系放晴与蓝天，不能只看一个孤立的词。' },
      { id: 'leaf', label: '金黄的梧桐叶', x: 27, y: 68, zoom: 2, clue: '颜色金黄，形状让人想到小巴掌，平展地贴在路面。', meaning: '从颜色、形状和贴着的状态，读懂金色巴掌与熨帖。' },
      { id: 'spread', label: '整条落叶路', x: 52, y: 80, zoom: 1.3, clue: '落叶不规则地排列，却铺成了丰富的图案。', meaning: '凌乱联系排列不规则；再看整段的美感，不把它等同于脏乱。' },
    ],
  }], ['选一个词，记录附近帮助理解的一个细节；小练笔保持选做。']),

  lesson('cn-06', 'scene', '把颜色、果香和过冬细节放回不同段意，理解秋雨串起的变化。', [{
    ...base('autumn-senses-map', '秋雨带来的三方面变化', '把细节卡连到它主要说明的方面，图景随选中的细节切换。', '同样写秋天，这些细节分别在说明什么？', '分类按细节主要表达的意思；香味仿佛拉住脚步是感受，不是有形的手。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'leaves', text: '银杏变黄，枫叶变红', artStep: 1 }, { id: 'fruit', text: '水果的香甜气味吸引孩子', artStep: 2 }, { id: 'squirrel', text: '小松鼠收集松果', artStep: 3 }, { id: 'frog', text: '小青蛙寻找过冬的洞穴', artStep: 3 }],
    targets: [{ id: 'colour', text: '秋天的颜色' }, { id: 'smell', text: '秋天的气味' }, { id: 'winter', text: '准备过冬' }],
    relations: [{ sourceId: 'leaves', targetId: 'colour', explanation: '叶色是看到的变化。' }, { sourceId: 'fruit', targetId: 'smell', explanation: '果香是闻到的气味。' }, { sourceId: 'squirrel', targetId: 'winter', explanation: '储备食物是过冬准备。' }, { sourceId: 'frog', targetId: 'winter', explanation: '找洞穴是过冬准备。' }], feedback: '把这张卡主要写什么说清，再决定关联到哪个方面。',
  }], ['选一个方面，用概括加一个细节介绍秋天。']),

  lesson('cn-07', 'sound', '把秋声的来源、动作与作者的想象联系起来。', [{
    ...base('autumn-sound-layers', '把秋声一层层打开', '调节不同声源的示意强弱，看看声源标记和声音层次如何组合。', '声音来自谁？作者又把它想成什么？', '用发声事物、动作和想象三项说清；略读口头交流即可，不新增必写。'),
    kind: 'sound', layers: [
      { id: 'leaves', label: '树叶与秋风', artStep: 0, clue: '落叶的变化与告别的想象相连。', soundHint: '沙沙的叶声示意', pattern: 'wind', x: 26, y: 40, initial: .5 },
      { id: 'cricket', label: '蟋蟀', artStep: 1, clue: '蟋蟀的鸣叫与歌唱、告别的想象相连。', soundHint: '短促虫鸣示意', pattern: 'insect', x: 53, y: 79, initial: 0 },
      { id: 'geese', label: '远行的大雁', artStep: 2, clue: '天空中的大雁声让诗人想到叮咛。', soundHint: '远近呼应的鸣叫示意', pattern: 'bird', x: 75, y: 22, initial: 0 },
    ], contrast: '先单独看一种声源，再组合；说清楚来源和诗人赋予的想象，不把声波示意当成诗句证据。', simulationNote: '声音或波纹为合成/图形提示，不是教材朗读录音或自然声音实录。',
  }], ['口头介绍一种秋声：谁怎样活动，让作者想到什么？'], '本课为略读，不新增必写、必背或必默任务。'),

  lesson('cn-09', 'story', '根据旅途中的消息预测，区分坚持目标与听取有用提醒。', [{
    ...base('taotao-open-route', '旅途消息，改变的是哪一步', '停在已经读到的消息处，选择一种可能和依据，再自主读后文或续编。', '坚持目标是否意味着方向走错了也不改变？', '新版教材没有给出最后结局；后续只能标为自己的续编，不能借原著补成教材结局。'),
    kind: 'prediction', stops: [
      { id: 'spider-warning', title: '听到蜘蛛劝阻', artStep: 1, known: '陶陶想参加狮王婚礼，已经上路；蜘蛛认为她爬得慢，劝她回家。', evidence: [{ id: 'goal', text: '她为了参加婚礼而主动上路。' }, { id: 'slow', text: '蜘蛛觉得她走得慢，赶不上。' }], predictions: [{ id: 'continue', text: '她可能继续向前，想亲自去看看。', basisIds: ['goal'] }, { id: 'reconsider', text: '她可能先想一想是否赶得上。', basisIds: ['slow'] }], outcome: '接着读到陶陶仍决定继续向前。', outcomeNote: '这里只核本处下一步，不提前展示以后的相遇。' },
      { id: 'cancelled-wedding', title: '听到新的消息', artStep: 3, known: '陶陶一路继续前行，也曾听从蜗牛提醒调整方向。壁虎现在告诉她婚礼取消了。', evidence: [{ id: 'kept-going', text: '遇到劝阻时她曾继续向前。' }, { id: 'changed-way', text: '她听取过有用提醒，改变了路线。' }], predictions: [{ id: 'journey', text: '她可能仍去看看，把旅行继续下去。', basisIds: ['kept-going'] }, { id: 'new-plan', text: '她可能改变原先的安排，寻找新的目标。', basisIds: ['changed-way'] }], outcomeNote: '本册在这里留下后续空间。请回纸本核对已读部分，再把接下来讲的内容标成自己的续编；不展示原著结局。' },
    ],
  }], ['口头续讲一种可能，并说一条已读依据；不要把续编当作教材结局。'], '本课为略读，不新增必写、必背或必默。新版旅行后续未写完，不引用原著结局代替教材。'),

  lesson('cn-10', 'story', '把学叫的愿望、学习经历和新线索连接起来，结局入口由孩子主动阅读。', [{
    ...base('dog-before-ending', '先有依据，再打开结局入口', '先在只读过的经历上作预测，再自主查看一个后续入口。', '新的可能怎样承接小狗一直想学叫的愿望？', '三个结局入口不预先排成唯一正确答案；这里只提示纸本入口，不补写结局，也不把自己的续编当作原文。'),
    kind: 'prediction', stops: [
      { id: 'learn-call', title: '学叫以前', artStep: 0, known: '小狗不会叫，这让它烦恼；它想改变这个困难。', evidence: [{ id: 'wish', text: '小狗想学会叫。' }, { id: 'difficulty', text: '它目前还不会叫。' }], predictions: [{ id: 'seek-help', text: '它可能找会叫的朋友学一学。', basisIds: ['wish'] }, { id: 'try-alone', text: '它可能先自己试着发出声音。', basisIds: ['wish', 'difficulty'] }], outcome: '后文出现了小公鸡，小狗跟着学习叫声。', outcomeNote: '本处只展开第一次学习的线索，不提前透露后来的人物与结局。' },
      { id: 'ending-gate', title: '停在结局以前', artStep: 3, known: '小狗认真学过不同的叫声，却受到嘲笑，也因叫声被误认而遇到危险。它仍有学叫的愿望。', evidence: [{ id: 'practised', text: '它为了学叫认真练习过。' }, { id: 'misunderstood', text: '前面的叫声曾引起误会。' }], predictions: [{ id: 'helpful-voice', text: '它可能再遇到能提供帮助的对象。', basisIds: ['practised'] }, { id: 'change-learning', text: '它可能换一种学习叫声的办法。', basisIds: ['misunderstood', 'practised'] }], outcome: '纸本提供三个结局入口：遇到小母牛、遇到农民、听到汪汪声。请自主打开其中一个入口继续阅读，再比较自己的猜想。', outcomeNote: '入口和完整结局不同。后面的续编请标为自己的想象，不补写未核验的教材结尾。' },
    ],
  }], ['任选一个纸本结局入口，口头说明后续如何承接前面的学叫经历。'], '本课为略读，不新增必写、必背或必默。三个结局入口只在主动揭示后显示。'),

  lesson('cn-11', 'story', '区分奶奶的故事和王葆的生活愿望，说明神奇想象从具体困难怎样生出。', [{
    ...base('gourd-story-levels', '谁的故事，谁的愿望', '把卡片连到叙述层次，观察人物和想象画面随卡片改变。', '奶奶讲过的故事，是否等于王葆已经得到宝葫芦？', '分清讲述者和是否实际发生；节选没有写王葆已经得到宝葫芦，不能把后续故事混入本课。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'peach', text: '奶奶故事里，愿望很快实现', artStep: 1 }, { id: 'math', text: '王葆为算术困难想到宝葫芦', artStep: 2 }, { id: 'sunflower', text: '王葆为向日葵长得不好生出愿望', artStep: 2 }],
    targets: [{ id: 'grandma', text: '奶奶讲的神奇故事' }, { id: 'wang', text: '王葆生活中的愿望' }],
    relations: [{ sourceId: 'peach', targetId: 'grandma', explanation: '这是奶奶故事中的神奇本领。' }, { sourceId: 'math', targetId: 'wang', explanation: '这是王葆在生活困难中产生的愿望。' }, { sourceId: 'sunflower', targetId: 'wang', explanation: '烦恼让王葆又想到神奇的帮助。' }], feedback: '先说是谁讲的、是谁遇到困难，再区分故事和愿望。',
  }], ['选一个具体困难，口头说明它怎样引出愿望；自己续编的内容另作标记。']),

  lesson('cn-12', 'story', '按课文节点追踪红头旅行，并将青头的帮助与危险连接。', [{
    ...base('cricket-story-travel', '跟着红头画情节路线', '依纸本把旅行节点接起来；路线和当前场景跟着选择改变。', '在哪个节点青头的帮助改变了红头的处境？', '此图是课文情节路径，不能当作牛全部消化过程或器官解剖图；用文本确认第一个胃、第二个胃及返回的顺序。'),
    kind: 'route', nodes: [
      { id: 'mouth-again', label: '回到牛嘴', artStep: 2, meaning: '红头又见光亮，却不能靠自己马上跳出。' },
      { id: 'first', label: '第一个胃', artStep: 2, meaning: '故事中红头随草移动，青头提醒它不要放弃。' },
      { id: 'outside', label: '牛嘴外', artStep: 3, meaning: '青头引发喷嚏，红头随草出来。' },
      { id: 'mouth', label: '进入牛嘴', artStep: 0, meaning: '躲藏的红头连草一起被卷入，开始求救。' },
      { id: 'second', label: '第二个胃', artStep: 2, meaning: '按课文叙述继续随草移动，随后返回嘴里。' },
    ], expectedOrder: ['mouth', 'first', 'second', 'mouth-again', 'outside'], explanation: '进入、随草移动、返回、出来构成情节路线；青头的提醒和行动与各节点相连。', routeNote: '课文情节示意，不代表牛全部消化过程，不展示模拟器官内部。',
  }], ['选一个危险节点，用“红头……青头……”口头说清互助。']),

  lesson('cn-13', 'story', '区分想吃的念头与实际行动，用证据说明队长怎样处理诱惑。', [{
    ...base('ant-thought-action-evidence', '想过什么，做了什么', '把念头和动作卡连到对应判断，不凭一张卡给人物贴标签。', '想吃是否等于已经偷吃？最后怎样处理更能说明选择？', '依据先后行动评价；不要抹掉队长的犹豫，也不要把犹豫当成已经违规。'),
    kind: 'association', artStep: 1,
    sources: [{ id: 'tempted', text: '闻到奶酪渣香味，队长想吃', artStep: 1 }, { id: 'call-back', text: '最终把伙伴叫回来', artStep: 2 }, { id: 'smallest', text: '公开把奶酪渣分给最小的蚂蚁', artStep: 3 }],
    targets: [{ id: 'thought', text: '念头与犹豫' }, { id: 'action', text: '实际处理的行动' }],
    relations: [{ sourceId: 'tempted', targetId: 'thought', explanation: '想吃是念头，不能据此断言已偷吃。' }, { sourceId: 'call-back', targetId: 'action', explanation: '叫回伙伴是实际改变处理方式。' }, { sourceId: 'smallest', targetId: 'action', explanation: '公开分配是最后的实际行动。' }], feedback: '先看卡片写的是想法还是已经发生的动作，再结合前后经过。',
  }], ['口头完成“虽然想……但最后做了……”；略读不新增必写字。'], '本课为略读，不新增必写、必背或必默任务。'),

  lesson('cn-16', 'landscape', '将海水、海底和海岛的细节连回主要意思，借关键语句概括段落。', [{
    ...base('xisha-key-sentence-net', '给段落主要意思找支撑', '将景物细节连到它支持的概括，连线组成海水、海底与海岛的图谱。', '一条具体描写怎样支持这一段的主要意思？', '先确定地点和细节特点；鱼既多又各不相同，不能只用数量概括全部内容。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'water', text: '海面有深浅不同的色带', artStep: 0 }, { id: 'coral', text: '珊瑚形状不同', artStep: 1 }, { id: 'fish', text: '各种鱼成群游动', artStep: 2 }, { id: 'birds', text: '岛上有树木、鸟巢和鸟蛋', artStep: 3 }],
    targets: [{ id: 'sea-colour', text: '海水颜色丰富' }, { id: 'undersea', text: '海底生物丰富' }, { id: 'bird-island', text: '海岛上鸟多' }],
    relations: [{ sourceId: 'water', targetId: 'sea-colour', explanation: '不同色带直接支持颜色丰富。' }, { sourceId: 'coral', targetId: 'undersea', explanation: '珊瑚的多种形状丰富海底景象。' }, { sourceId: 'fish', targetId: 'undersea', explanation: '数量和形态共同说明鱼群丰富。' }, { sourceId: 'birds', targetId: 'bird-island', explanation: '鸟巢、鸟蛋等细节围绕鸟多展开。' }], feedback: '找的是支持关系；先读具体写了什么，再决定能支持哪个概括。',
  }], ['为一个段落主要意思找到两处纸本细节，用自己的话连起来。']),

  lesson('cn-17', 'landscape', '沿地点观察小城，说明庭院、公园、街道各围绕什么特点展开。', [{
    ...base('seaside-paragraph-path', '地点、特点和细节', '将介绍细节连到合适地点，图景随所选细节切换。', '介绍一处地方，只说很好看够不够？', '用地点加特点加具体细节说明；关键语句可能位于段首，也可由全文概括，不机械套模板。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'trees', text: '树种多，树叶有香味，花景丰富', artStep: 1 }, { id: 'shade', text: '榕树树冠展开，人们在下面乘凉', artStep: 2 }, { id: 'clean', text: '路面开阔，清洁程度写得具体', artStep: 3 }],
    targets: [{ id: 'courtyard', text: '庭院：树多' }, { id: 'park', text: '公园：榕树浓密、遮阴' }, { id: 'street', text: '街道：整洁' }],
    relations: [{ sourceId: 'trees', targetId: 'courtyard', explanation: '树种、香味和花景共同支持庭院的特点。' }, { sourceId: 'shade', targetId: 'park', explanation: '树冠和乘凉把公园特点写具体。' }, { sourceId: 'clean', targetId: 'street', explanation: '路面细节支持街道整洁。' }], feedback: '细节要服务于所说的特点，不能把不同地点的描写随意拼接。',
  }], ['选一个地点，口头说“这里……例如……”，再回纸本定位依据。']),

  lesson('cn-18', 'landscape', '比较同一片森林四季变化，并区分景色与物产如何支持结尾。', [{
    ...base('forest-four-season-compare', '同一片森林的四季', '直接切换季节，对比枝叶、地面和动物活动；每次选一处具体变化。', '这些细节分别怎样说明美丽的大花园或巨大的宝库？', '不把所有景物都归成物产；比较的主体是同一地区的季节变化，示意画面不表示固定日期。'),
    kind: 'compare', options: [
      { id: 'spring', label: '春：新生', artStep: 0, caption: '新叶、融雪与溪边小鹿，写出春天的生机。', evidence: '新叶和融雪对应春季变化。', marks: [mark('buds', '新叶', 34, 32, 'leaf')] },
      { id: 'summer', label: '夏：浓绿', artStep: 1, caption: '繁密枝叶、雾与野花，使夏日森林有层次。', evidence: '茂盛的枝叶与花景支持大花园的美感。', marks: [mark('dense', '浓密树冠', 48, 28, 'spot')] },
      { id: 'autumn', label: '秋：收获', artStep: 2, caption: '叶色变化，山中的果实和食物也很丰富。', evidence: '彩叶着眼景色，食物与药材着眼物产。', marks: [mark('coloured', '彩叶', 34, 33, 'leaf'), mark('fruit', '物产', 71, 73, 'node')] },
      { id: 'winter', label: '冬：生命', artStep: 3, caption: '雪与北风写出寒冷，动物仍有过冬方式。', evidence: '冬季并非没有生命，要同时留意动物的活动。', marks: [mark('snow', '积雪', 44, 80, 'spot')] },
    ],
  }], ['选两个季节，各找一处变化；用一个物产细节解释宝库的意思。']),

  lesson('cn-19', 'landscape', '让贸易、美食和旅游资料各自支撑一个介绍重点。', [{
    ...base('hongkong-guide-network', '给导游介绍搭资料网', '把资料卡连到介绍栏目，选择后图景与资料栏目同步改变。', '为什么不能只用灯光多概括整篇的明珠形象？', '课文地点与历史联系以纸本为准，不把旅游补充或当前现实情况当作教材必记事实。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'goods', text: '不同来源的商品和商人', artStep: 0 }, { id: 'dishes', text: '不同地方的菜肴汇集', artStep: 1 }, { id: 'sculpture', text: '金紫荆等景观', artStep: 2 }, { id: 'lights', text: '维多利亚港夜景灯光', artStep: 3 }],
    targets: [{ id: 'trade', text: '贸易活动繁荣' }, { id: 'food', text: '美食丰富' }, { id: 'tourism', text: '旅游景观多样' }],
    relations: [{ sourceId: 'goods', targetId: 'trade', explanation: '来源广和品种多支持贸易特点。' }, { sourceId: 'dishes', targetId: 'food', explanation: '不同风味支持美食丰富。' }, { sourceId: 'sculpture', targetId: 'tourism', explanation: '具体景观支持旅游介绍。' }, { sourceId: 'lights', targetId: 'tourism', explanation: '港口夜景是旅游景观之一。' }], feedback: '说明这条资料支持哪一个重点；同一篇介绍可以从几个方面展开。',
  }], ['选一个栏目，用特点和一条资料作两句口头介绍。'], '本课为略读，不新增必写、必背或必默任务。'),

  lesson('cn-20', 'poem', '从人声与夕照、江流与视角、晴雨对照读懂三首山水诗。', [
    {
      ...base('luchai-light-and-sound', '空山：不见人，不等于没有人', '点人声线索或夕照线索，再拖动光束示意，观察青苔所在处。', '看不见人和听到人声矛盾吗？', '区分视觉与听觉；返景是夕照，不能画成月光，也不是光线真的倒着走。'),
      kind: 'compare', parameter: { id: 'light', label: '林间光束示意', min: 0, max: 100, initial: 55, effect: 'light' }, options: [
        { id: 'voices', label: '听：人语响', artStep: 0, artVariant: 'luchai', caption: '看不见人，却听得见说话声，声音衬出空山的幽静。', evidence: '不见与但闻分别属于看和听，不是互相否定。', marks: [mark('voice', '人声传来', 74, 47, 'wave')] },
        { id: 'moss', label: '看：返景照青苔', artStep: 1, artVariant: 'luchai', caption: '夕照穿过深林，照到青苔上。', evidence: '入、照连出光线到达的地方；夕照不是月光。', marks: [mark('moss', '青苔', 49, 78, 'light')] },
      ],
    },
    {
      ...base('tianmen-viewpoint', '舟行中看山与江', '切换江水和两岸山的观察重点，再用远近示意体验观察位置变化。', '“相对出”是青山真的向外行走吗？', '从行舟者的观察解释山仿佛出现，不把诗意画面当成地形精确测量或水流实验。'),
      kind: 'compare', parameter: { id: 'distance', label: '行舟观察位置示意', min: 0, max: 100, initial: 45, effect: 'distance' }, options: [
        { id: 'river', label: '江水：开与回', artStep: 0, artVariant: 'wangtianmenshan', caption: '江水穿过相对的山峰，诗中的开与回写出气势。', evidence: '水的方向与山的位置联系起来读。', marks: [mark('river', '江流', 50, 71, 'arrow')] },
        { id: 'mountains', label: '两岸：相对出', artStep: 1, artVariant: 'wangtianmenshan', caption: '行舟时景物相对位置改变，青山仿佛迎面而出。', evidence: '观察者在移动，不能据此说山真的移动。', marks: [mark('left-bank', '左岸青山', 26, 52, 'spot'), mark('right-bank', '右岸青山', 73, 48, 'spot')] },
      ],
    },
    {
      ...base('westlake-weather-compare', '西湖晴雨，两种美', '直接对比晴天水光与雨中山色，找出各自的诗句证据。', '晴方好与雨亦奇说明只有一种天气美吗？', '晴雨各有特点，西子是比喻联系，不添加课文外必记人物知识。'),
      kind: 'compare', options: [
        { id: 'sunny', label: '晴：水光闪动', artStep: 0, artVariant: 'yinhushang', caption: '晴天水面光影闪动，诗人觉得很好。', evidence: '联系水光潋滟和晴方好。', marks: [mark('sunlight', '水光', 32, 60, 'light')] },
        { id: 'rainy', label: '雨：山色朦胧', artStep: 1, artVariant: 'yinhushang', caption: '雨中远山朦胧，也有不同的美。', evidence: '亦表示也，与晴方好一起说明两种天气都美。', marks: [mark('rain', '雨中远山', 64, 28, 'wave')] },
      ],
    },
  ], ['选晴雨对照或听看对照，用原诗一个关键词说明理解。'], '古诗原文与拼音复用公版材料；背默清单沿用已核教材安排。'),

  lesson('cn-21', 'sound', '用风、水、动物的层次和强弱体会生动语言，读清声音变化的顺序。', [{
    ...base('nature-orchestra-controls', '自然音乐的层次', '单独打开一层声源，再调节强弱或组合，比较风、水和动物各自的变化。', '把微风和强风、水从小溪到大海的变化怎样说具体？', '声景为示意，不替代课文用词；回到原句找动作和声音词，说明自己的感受。'),
    kind: 'sound', layers: [
      { id: 'wind', label: '风的强弱', artStep: 1, clue: '微风轻柔与狂风强烈形成对照。', soundHint: '从轻柔到强烈的风声示意', pattern: 'wind', x: 27, y: 32, initial: .35 },
      { id: 'rain', label: '雨滴敲击', artStep: 2, clue: '雨滴落在不同物体上会产生不同声音。', soundHint: '间隔敲击的雨滴示意', pattern: 'rain', x: 68, y: 58, initial: 0 },
      { id: 'water', label: '小溪、河流、大海', artStep: 2, clue: '课文按小溪、河流到大海组织越来越开阔的水声。', soundHint: '连续流水由轻到强示意', pattern: 'stream', x: 49, y: 79, initial: 0 },
      { id: 'animals', label: '鸟与虫的合唱', artStep: 3, clue: '不同动物发声，让作者联想到合唱。', soundHint: '短音呼应的动物声示意', pattern: 'bird', x: 73, y: 36, initial: 0 },
    ], contrast: '调强弱是在比较语言感受，不是实测分贝；小溪到河流再到大海的顺序须回课文核对。', simulationNote: '声音或波纹为合成/图形提示，不是自然实录，也不替代教材朗读。',
  }], ['选一种声源，用动作加声音的描写说明感受。']),

  lesson('cn-22', 'observe', '更换动作、形状、变化与声音的观察角度，解释自然为什么读不完。', [{
    ...base('nature-observation-lens', '换个角度，多一个发现', '点鸟、昆虫或植物，把镜头移到对应细节，再说你注意了什么。', '只说大自然很美，和说出具体发现有什么不同？', '喜欢的观察角度可以不同，但理由需连到具体描写；示意图不是物种鉴定或生长周期测量。'),
    kind: 'hotspot', artStep: 0, spots: [
      { id: 'bird', label: '鸟的动作', x: 14, y: 15, zoom: 1.65, clue: '比较不同鸟的动作和姿态，能读出不同感受。', meaning: '抓动作解释活泼或有力量，不只列出鸟名。' },
      { id: 'insect', label: '小昆虫的活动', x: 59, y: 76, zoom: 2, clue: '观察小昆虫停留或飞动的姿态，也能发现细节。', meaning: '小并不等于不重要，动作能够引起思考。' },
      { id: 'plant', label: '植物的变化', x: 90, y: 14, zoom: 1.6, clue: '形状、颜色与不同时候的变化提供新的观察角度。', meaning: '自然不断变化，人的发现也可继续增加，所以这本大书读不完。' },
    ],
  }], ['口头说一种具体发现：看到了什么，怎样活动或变化？']),

  lesson('cn-23', 'classical', '把文言停顿与人物行动连接，理解去、之及动作导致的结果。', [{
    ...base('simaguang-pauses-and-actions', '停一停，辨行动', '在字与字之间点出语意停顿，再把当前语句连到对应行动。', '“去”与“之”分别对应哪一个动作或对象？', '停顿为本项目辅助读法，不当作唯一朗读标准；先弄懂谁做什么。“之”指瓮，不能解释成人。'),
    kind: 'classical', lines: [
      { id: 'play', text: '群儿戏于庭', chunks: ['群儿', '戏', '于庭'], alternativeChunks: [['群儿', '戏于庭']], meaning: '一群孩子在庭院里玩耍。', artStep: 0, actionId: 'playing' },
      { id: 'fall', text: '一儿登瓮足跌没水中', chunks: ['一儿', '登瓮', '足跌', '没水中'], meaning: '一个孩子登上瓮，失足落入水中。', artStep: 1, actionId: 'falling' },
      { id: 'leave', text: '众皆弃去', chunks: ['众', '皆', '弃去'], alternativeChunks: [['众皆', '弃去']], meaning: '其他孩子都离开了；去在这里是离开。', artStep: 2, actionId: 'leaving' },
      { id: 'break', text: '光持石击瓮破之', chunks: ['光', '持石', '击瓮', '破之'], alternativeChunks: [['光', '持石击瓮', '破之'], ['光持石', '击瓮', '破之']], meaning: '司马光拿石头击打瓮，把它打破；之指瓮。', artStep: 3, actionId: 'breaking' },
      { id: 'saved', text: '水迸儿得活', chunks: ['水迸', '儿', '得活'], alternativeChunks: [['水迸', '儿得活']], meaning: '水涌出来，落水的孩子获救。', artStep: 3, actionId: 'saving' },
    ], actions: [{ id: 'breaking', text: '持石击破瓮', artStep: 3 }, { id: 'playing', text: '庭院玩耍', artStep: 0 }, { id: 'saving', text: '水出，孩子获救', artStep: 3 }, { id: 'leaving', text: '其他孩子离开', artStep: 2 }, { id: 'falling', text: '登瓮后失足落水', artStep: 1 }],
    refs: [
      { id: 'zhi-object', word: '之', lineId: 'break', question: '“破之”中的“之”指哪一个对象？', targetId: 'jar', targets: [
        { id: 'child', text: '落水的孩子', artStep: 3, explanation: '孩子是获救的人；“破之”写打破的对象，不能把“之”指成人。' },
        { id: 'jar', text: '装水的瓮', artStep: 3, explanation: '“击瓮”先点出对象，“破之”接着说把这个瓮打破；“之”指瓮。' },
      ] },
      { id: 'qu-action', word: '去', lineId: 'leave', question: '“众皆弃去”中的“去”在这里表示什么行动？', targetId: 'leave', targets: [
        { id: 'toward', text: '走向瓮边', artStep: 1, explanation: '现代话里“去某处”可以说目的地，但本句没有这个意思；要联系其他孩子丢下同伴的行动来理解。' },
        { id: 'leave', text: '离开这里', artStep: 2, explanation: '“众皆弃去”写其他孩子都丢下同伴离开；“去”在本句中是离开。' },
      ] },
    ], explanation: '行动的先后构成故事；持石、击瓮、破之与水迸相连，解释如何脱险。',
  }], ['选去或之，说明词义并指出对应行动；原文背诵范围沿用教材。'], '文言原文为公版；工具拆成语意块是辅助理解，不新增统一唯一的断句考点。'),

  lesson('cn-24', 'story', '把两次争气中的困难、行动和结果配对，区分个人进步与为国争气。', [{
    ...base('tongdizhou-two-experiences', '两次争气，用行动说明', '将细节连到相应经历，画面随学习或实验细节变化。', '仅说一定要争气，与用具体行动面对困难有什么不同？', '不把人物努力简化为每天越久越好；教材写持续学习与钻研，不能把一次分数当成人的全部价值。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'study-hard', text: '基础薄弱后利用早晚时间勤学', artStep: 1 }, { id: 'study-result', text: '各科赶上，几何取得满分', artStep: 0 }, { id: 'experiment-hard', text: '面对难题刻苦钻研，反复实践', artStep: 2 }, { id: 'experiment-result', text: '困难实验做成，用行动回应轻视', artStep: 3 }],
    targets: [{ id: 'school', text: '中学：不甘落后，改变学习情况' }, { id: 'abroad', text: '留学：努力实验，为中国人争气' }],
    relations: [{ sourceId: 'study-hard', targetId: 'school', explanation: '勤学是中学经历中的行动。' }, { sourceId: 'study-result', targetId: 'school', explanation: '成绩进步是中学经历的结果。' }, { sourceId: 'experiment-hard', targetId: 'abroad', explanation: '钻研与实践是困难实验中的行动。' }, { sourceId: 'experiment-result', targetId: 'abroad', explanation: '实验结果回应了偏见，目标还联系国家。' }], feedback: '看细节处于哪件事，再用困难、行动与结果说明人物。',
  }], ['任选一次经历，口头按“困难—行动—结果”说明争气。'], '只沿已核童第周课文，不混入旧版其他人物，也不补造实验操作细节。'),

  lesson('cn-25', 'story', '把环境变化与医生言行关联，用职责解释课题。', [{
    ...base('bethune-environment-duty', '环境变了，职责怎样体现', '把环境或情境卡连到相关行动与职责，比较图景中的危险和工作。', '课题中的阵地为什么能指手术台？', '用课文环境与行动解释，画面不展伤口或添加手术细节；不把战地情境泛化成现实危险中必须不撤离的规则。'),
    kind: 'association', artStep: 0,
    sources: [{ id: 'patients', text: '伤员不断需要救治', artStep: 0 }, { id: 'danger', text: '周围炮火和烟雾使处境危险', artStep: 1 }, { id: 'suggestion', text: '有人转达撤离决定', artStep: 2 }],
    targets: [{ id: 'task', text: '在手术台承担救治任务' }, { id: 'continue', text: '危险中仍继续为伤员工作' }, { id: 'responsibility', text: '说明岗位职责，并落实为救治行动' }],
    relations: [{ sourceId: 'patients', targetId: 'task', explanation: '伤员的需要说明医生任务。' }, { sourceId: 'danger', targetId: 'continue', explanation: '处境与行动对照，才能评价应对。' }, { sourceId: 'suggestion', targetId: 'responsibility', explanation: '回答与后续行动解释阵地所指的职责。' }], feedback: '环境写发生了什么，行动写人物怎样回应；将这两边连起来再解释课题。',
  }], ['用一处人物行动回答“手术台为什么也是阵地”，再到纸本找依据。']),

  lesson('cn-26', 'story', '追踪碗与饭食的去向，用具体行动解释关心战士。', [{
    ...base('rough-bowl-object-route', '一只碗，串起几件事', '依纸本接起物品与饭食的去向，当前画面跟随事件改变。', '这只碗的价值为什么不只在外表？', '区分原来送出的用具与后来找到的粗瓷碗；不能把它们画成同一个已经有的碗。略读只需用物品线索口头复述。'),
    kind: 'route', nodes: [
      { id: 'rice', label: '米饭回锅，换野菜粥', artStep: 2, meaning: '赵一曼把较好的饭留下，自己换成野菜粥。' },
      { id: 'old-utensil', label: '原有用具给新战士', artStep: 1, meaning: '先有送用具的行动，她自己没有合用的饭碗。' },
      { id: 'new-bowl', label: '通讯员找来粗瓷碗', artStep: 1, meaning: '别人关心她的生活，为她找到碗并盛饭。' },
      { id: 'dish', label: '粗瓷碗成了七班菜盆', artStep: 3, meaning: '同一个新找到的碗后来又服务于战士的需要。' },
    ], expectedOrder: ['old-utensil', 'new-bowl', 'rice', 'dish'], explanation: '先送旧用具，再得到粗瓷碗，随后换饭，后来碗给七班使用。', routeNote: '两件不同用具与饭食的去向构成叙事线索，不是碗的价格或外观比较。',
  }], ['沿物品线索口头复述，并说明一次行动是在关心谁。'], '本课为略读，不新增必写、必背或必默任务。'),
];

export function getChinesePrecisionLesson(courseId: string): PrecisionLesson | undefined {
  return chinesePrecisionLessons.find(lesson => lesson.courseId === courseId);
}

/** Reuse public-domain poems and their existing audited pinyin, never invent a new recitation list. */
export function getPrecisionPoems(courseId: string) {
  return lessonMaterialById.get(courseId)?.poems ?? [];
}
