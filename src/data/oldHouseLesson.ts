export type OldHouseStoryStopId = 'opening' | 'cat' | 'hen' | 'spider';
export type OldHouseEvidenceSource = '课文线索' | '情境线索' | '生活经验' | '无关线索';
export type OldHouseEvidence = { id: string; text: string; source: OldHouseEvidenceSource };
export type OldHousePrediction = {
  id: string;
  text: string;
  basisIds: string[];
  supported: boolean;
  explanation: string;
};
export type OldHousePredictionCase = {
  id: 'cat' | 'hen' | 'spider' | 'transfer';
  title: string;
  visitor: string;
  knownSummary: string;
  evidence: OldHouseEvidence[];
  predictions: OldHousePrediction[];
  outcomeSummary: string;
  compareNote: string;
  teachingNote: string;
};
export type OldHouseStoryStop = {
  id: OldHouseStoryStopId;
  title: string;
  visitor: string | null;
  knownSummary: string;
  evidenceSummary: string;
  outcomeSummary: string;
  sceneLabel: string;
  question: string;
};
export type OldHouseRecognitionFocusItem = {
  character: string;
  pinyin: string;
  parts: string;
  attention: string;
  words: string[];
  meaning: string;
};
export type OldHouseWritingFocusItem = OldHouseRecognitionFocusItem & { distinguish?: string };
export type OldHouseWordFocusItem = {
  text: string;
  pinyin: string;
  meaning: string;
  attention: string;
  example: string;
};

// Scope is inherited from the existing revised-edition cn-08 inventory. Local
// coaching does not promote the unverified 2026 paper or global reading flags.
export const oldHouseRequirementNote =
  '本课字词参照项目采用的2025新版公开预览：会认8字、会写11字、课内词语14个。单字辅导读音按本课语境和字典核对，不改变全册核验状态。2026纸本正文、旁批、课后题及背诵、默写要求仍待核对，以纸本为准。本页情节是原创概述，插画是原创辅助画面；请结合完整课文阅读。预测练习关注猜想的依据；不同的合理猜想可以保留，再读后文进行比较和修改。';

export const oldHouseRecognitionFocus: OldHouseRecognitionFocusItem[] = [
  {
    character: '眯', pinyin: 'mī', parts: '左边目字旁，右边米字。',
    attention: '这里表示眼睛微微合拢，读第一声 mī；认清目字旁，联系眼睛的动作。',
    words: ['眯眼', '笑眯眯'], meaning: '眼皮微微合拢；读到这个字，可以想象老屋看人的神态。',
  },
  {
    character: '哦', pinyin: 'ò', parts: '左边口字旁，右边我字。',
    attention: '本课回应、答应的语气读 ò；表示疑问或惊奇时可读 ó，要放回句子判断。',
    words: ['哦，明白了'], meaning: '表示领会、回应的语气词；读时注意说话人的语气。',
  },
  {
    character: '喵', pinyin: 'miāo', parts: '左边口字旁，右边苗字，上面草字头、下面田。',
    attention: '读 miāo，第一声；这是表示猫叫声的字，和苗字的声调不同。',
    words: ['喵喵叫', '喵呜'], meaning: '模拟猫的叫声；把声音和小猫联系起来认读。',
  },
  {
    character: '孵', pinyin: 'fū', parts: '左边是卵的字形，右边是孚，上部爪字头、下部子。',
    attention: '读 fū，第一声；结合母鸡和鸡蛋理解，不读成浮字的第二声。',
    words: ['孵蛋', '孵化'], meaning: '给卵提供适当条件，使里面的小生命发育并出来。',
  },
  {
    character: '叽', pinyin: 'jī', parts: '左边口字旁，右边几字。',
    attention: '读 jī，第一声；借小鸡的叫声认读，注意几作单字时的声调不同。',
    words: ['叽叽叫', '叽叽喳喳'], meaning: '模拟小鸡、小鸟等发出的声音。',
  },
  {
    character: '缝', pinyin: 'fèng', parts: '左边绞丝旁，右边逢字。',
    attention: '一条缝、缝隙中的缝读 fèng；缝衣服的缝读 féng。先判断表示空隙还是动作。',
    words: ['缝隙', '门缝'], meaning: '这里指细长的空隙；联系眼睛眯起后的样子理解。',
  },
  {
    character: '偶', pinyin: 'ǒu', parts: '左边单人旁，右边禺的字形。',
    attention: '读 ǒu，第三声，没有声母；与尔合起来读偶尔，表示有时发生。',
    words: ['偶尔', '偶然'], meaning: '在偶尔中表示事情有时才发生，不是每次都发生。',
  },
  {
    character: '尔', pinyin: 'ěr', parts: '先看上部的撇和横钩，再看下面小的字形。',
    attention: '读 ěr，第三声；偶尔是两个音节，不把尔读成前一个字的儿化尾音。',
    words: ['偶尔'], meaning: '与偶组成偶尔，整体理解为有时候。',
  },
];

const oldHouseWritingFocus: OldHouseWritingFocusItem[] = [
  {
    character: '屋', pinyin: 'wū', parts: '外面尸字头，里面至字。',
    attention: '尸字头的长撇舒展，里面至的下部是土；看清中间的折和点。',
    distinguish: '屋里面是至；居里面是古。读老屋、居住时分别认清。',
    words: ['老屋', '屋子'], meaning: '房屋、房间；本课主人公是一座老屋。',
  },
  {
    character: '板', pinyin: 'bǎn', parts: '左边木字旁，右边反字。',
    attention: '木字旁的最后一笔是点；右边反的横撇和捺要写清。',
    distinguish: '门板的板是木字旁；版本的版是片字旁。',
    words: ['门板', '木板'], meaning: '片状的材料；门板是门的板状部分。',
  },
  {
    character: '准', pinyin: 'zhǔn', parts: '左边两点水，右边隹的字形。',
    attention: '左边只有两点；右边竖着排列的四横要数清，末横稍长。',
    distinguish: '准左边是两点水；难左边是又。不要给准多添一点。',
    words: ['准备', '准时'], meaning: '准备中表示事先安排；准时表示符合约定的时间。',
  },
  {
    character: '备', pinyin: 'bèi', parts: '上面夂的字形，下面田字。',
    attention: '上部撇、横撇、捺舒展；下部田里面有一横一竖，不能少写。',
    distinguish: '备下面是田；各下面是口。用准备、各自分别组词。',
    words: ['准备', '备用'], meaning: '预先安排、具备；准备是事先做好安排。',
  },
  {
    character: '等', pinyin: 'děng', parts: '上面竹字头，下面寺字，由土和寸组成。',
    attention: '竹字头左右相让；寸的点不要遗漏，竖钩写在下部。',
    distinguish: '等下面是寺；筒下面是同。认部件后再写完整的字。',
    words: ['等待', '等候'], meaning: '留在原处或延后一段时间，直到事情发生。',
  },
  {
    character: '暴', pinyin: 'bào', parts: '上部是日，中间有共的字形，下部有点和撇捺。',
    attention: '上面的日写扁；中间的两横和下部各笔按字帖对照，不能漏点、漏撇。',
    distinguish: '暴风雨的暴没有火字旁；爆竹的爆有火字旁。',
    words: ['暴风雨', '暴雨'], meaning: '这里表示强烈、猛烈，暴风雨是强风伴随大雨。',
  },
  {
    ...oldHouseRecognitionFocus.find(item => item.character === '哦')!,
    attention: '口字旁写窄，右边我字的斜钩和点写清；本课回应、答应时读 ò。',
    distinguish: '哦右边是我；饿左边是食字旁。看偏旁，再结合意思辨认。',
  },
  {
    character: '钻', pinyin: 'zuān', parts: '左边金字旁，右边占字。',
    attention: '表示钻进、穿过去时读 zuān；金字旁最后一笔是竖提，右边占下部是口。',
    distinguish: '钻进读 zuān；钻石读 zuàn。用意思选择读音。',
    words: ['钻进', '钻洞'], meaning: '进入较小的空间或穿过孔洞。',
  },
  {
    character: '爬', pinyin: 'pá', parts: '左边爪字的字形，右边巴字。',
    attention: '左边爪的捺舒展；右边巴的下部竖弯钩要稳，不要把爪写成瓜。',
    distinguish: '爬左边是爪；抓左边是提手旁、右边是爪。',
    words: ['爬行', '爬过去'], meaning: '用手脚或肢体贴近物体移动。',
  },
  {
    character: '漂', pinyin: 'piào', parts: '左边三点水，右边票字。',
    attention: '漂亮的漂读 piào；票下部示的两点不要漏，右上部不要添成酉字。',
    distinguish: '漂亮读 piào，漂流读 piāo，漂白读 piǎo；漂有三点水，飘有风字旁。',
    words: ['漂亮'], meaning: '在漂亮中表示好看、美观。',
  },
  {
    character: '晒', pinyin: 'shài', parts: '左边日字旁，右边西字。',
    attention: '日字旁写窄；西里面没有横，不要写成酉字。',
    distinguish: '晒左边是日；洒左边是三点水。联系阳光和水来分辨。',
    words: ['晒太阳', '晒衣服'], meaning: '让太阳照到；晒衣服是借阳光等条件使衣服变干。',
  },
];

// Exactly the existing 14 words. Examples are original optional coaching,
// not new required dictation words or reproduction of textbook sentences.
export const oldHouseWordFocus: OldHouseWordFocusItem[] = [
  { text: '门板', pinyin: 'mén bǎn', meaning: '构成门的板状部分。', attention: '板是木字旁；不要和版字混写。', example: '风吹来时，门板轻轻晃了一下。' },
  { text: '准备', pinyin: 'zhǔn bèi', meaning: '事先安排或做好打算。', attention: '准是两点水；备下面是田。', example: '我准备先读故事，再说自己的猜想。' },
  { text: '旁边', pinyin: 'páng biān', meaning: '靠近某物的一侧。', attention: '旁读 páng，后鼻音 ang；边读 biān，前鼻音 an。', example: '我在插图旁边记下找到的线索。' },
  { text: '暴风雨', pinyin: 'bào fēng yǔ', meaning: '强风伴随着大雨的天气。', attention: '暴没有火字旁；风是后鼻音 eng。', example: '暴风雨来临前，大家把窗户关好了。' },
  { text: '安心', pinyin: 'ān xīn', meaning: '心里安定，不再担忧。', attention: '安和心都是前鼻音；结合人物担心什么来理解。', example: '找到了避雨的地方，小猫才安心休息。' },
  { text: '低头', pinyin: 'dī tóu', meaning: '把头向下垂。', attention: '低是单人旁，右边的点不能漏；不要写成底。', example: '我低头看了看纸上的字。' },
  { text: '吃力', pinyin: 'chī lì', meaning: '做事情费劲，觉得困难。', attention: '吃读 chī，翘舌音；联系老屋的动作体会费劲。', example: '他吃力地搬起装满书的箱子。' },
  { text: '再见', pinyin: 'zài jiàn', meaning: '分别时使用的告别语。', attention: '告别用再见的再；地点、存在用在字。', example: '放学时，我向同学挥手说再见。' },
  { text: '母鸡', pinyin: 'mǔ jī', meaning: '雌性的鸡。', attention: '母的两点不要漏；母读第三声，鸡读第一声。', example: '母鸡在安静的角落里照看鸡蛋。' },
  { text: '注意', pinyin: 'zhù yì', meaning: '把心思放在某一方面，留心。', attention: '注是翘舌音 zh；意下面是心。', example: '读到新线索时，我注意调整原来的猜想。' },
  { text: '屋子', pinyin: 'wū zi', meaning: '房屋或房间。', attention: '词语里的子读轻声 zi；屋里面是至。', example: '雨停后，阳光照进了屋子。' },
  { text: '漂亮', pinyin: 'piào liang', meaning: '好看、美观。', attention: '漂读第四声 piào；亮在这个词里读轻声 liang。', example: '我画了一张漂亮的故事卡。' },
  { text: '意思', pinyin: 'yì si', meaning: '表达的内容；也可表示趣味。', attention: '思在这个词里读轻声 si；有意思可以表示有趣。', example: '我想说清楚这条线索的意思。' },
  { text: '因此', pinyin: 'yīn cǐ', meaning: '表示前面的原因带来了后面的结果。', attention: '因此后面说结果；此读 cǐ，平舌音 c。', example: '花盆里的土很干，因此我给花浇了水。' },
];

export const oldHouseLessonCopy = {
  title: '总也倒不了的老屋',
  intro: '来到老屋门前。读到一个请求，先停一停：接下来可能怎样？把找到的线索放在猜想旁边，再读后文看看。',
  writingFocus: oldHouseWritingFocus,
  sources: [
    { title: '人教社编辑孙浩浩：如何开展有效预测（教学原理）', url: 'https://www.pep.com.cn/bks/xxyw/jzjd/202506/W020250624356987921486.pdf' },
    { title: '人教社：阅读策略教学从示范走向独立运用（教学原理）', url: 'https://www.pep.com.cn/bks/xxyw/jzjd/202505/W020250531418254738022.pdf' },
    { title: '人教社《总也倒不了的老屋》课例（旧版课例，供策略参考）', url: 'https://www.pep.com.cn/xw/zt/xkzt/dsj/klzs/202112/t20211228_1973052.shtml' },
    { title: '同26课目录的2025新版公开预览（第三方，2026纸本待核）', url: 'https://www.scribd.com/document/1067004050/%E4%BA%BA%E6%95%99%E7%89%88-%E4%B8%89%E5%B9%B4%E7%BA%A7%E4%B8%8A%E5%86%8C-2025%E7%A7%8B%E7%89%88-%E8%AF%AD%E6%96%87%E7%94%B5%E5%AD%90%E8%AF%BE%E6%9C%AC' },
    { title: '汉典：眯（mī／mí）', url: 'https://www.zdic.net/hans/眯' },
    { title: '汉典：哦（ò回应、答应；ó疑问）', url: 'https://www.zdic.net/hans/哦' },
    { title: '汉典：缝（fèng空隙／féng缝补）', url: 'https://www.zdic.net/hans/缝' },
    { title: '汉典：钻（zuān进入／zuàn钻石）', url: 'https://www.zdic.net/hans/钻' },
    { title: '汉典：漂（piào漂亮／piāo漂流／piǎo漂白）', url: 'https://www.zdic.net/hans/漂' },
    { title: '汉典：汉字读音、部件和基本释义', url: 'https://www.zdic.net/' },
  ],
};

// Story summaries contain only information available at each stopping point.
// Outcome fields are separate so the UI can reveal them deliberately.
export const oldHouseStoryStops: OldHouseStoryStop[] = [
  {
    id: 'opening', title: '来到老屋前', visitor: null,
    knownSummary: '老屋年纪很大，门窗破旧，已经很久没人住了。它觉得自己该倒下了。',
    evidenceSummary: '从题目、老屋的样子和它的话，想想接下来可能发生什么。',
    outcomeSummary: '', sceneLabel: '老屋门前', question: '题目说老屋总也倒不了。你有哪些猜想？能说出理由吗？',
  },
  {
    id: 'cat', title: '第一处：门前的请求', visitor: '小猫',
    knownSummary: '外面有暴风雨，小猫没有安心睡觉的地方。它请求老屋再等一个晚上。',
    evidenceSummary: '看看小猫遇到的困难，也想想老屋刚才准备做什么。',
    outcomeSummary: '老屋答应等待。小猫在屋里过了一夜，第二天道谢离开。',
    sceneLabel: '雨夜的请求', question: '老屋可能怎样回应小猫？你找到了哪条线索？',
  },
  {
    id: 'hen', title: '第二处：又一个请求', visitor: '老母鸡',
    knownSummary: '小猫离开后，老屋又准备倒下。老母鸡来到门前，想找一个安心孵蛋的地方，请老屋再等等。',
    evidenceSummary: '把这次请求和老屋上次的回应联系起来，也留意孵蛋需要时间。',
    outcomeSummary: '老屋又答应等待。后来小鸡孵出来了，老母鸡带着小鸡道谢离开。',
    sceneLabel: '需要等待的请求', question: '这次请求需要等得更久。你的猜想会改变吗？',
  },
  {
    id: 'spider', title: '第三处：新的请求', visitor: '小蜘蛛',
    knownSummary: '老屋已经等过小猫和老母鸡，又准备倒下。小蜘蛛很饿，想在屋里织网抓虫，请老屋等等。',
    evidenceSummary: '前面两次发生了什么？小蜘蛛这次需要老屋帮什么忙？',
    outcomeSummary: '老屋让小蜘蛛织网。小蜘蛛抓到虫子，还给老屋讲故事；课文结尾写到老屋仍在听它讲。',
    sceneLabel: '还在继续的故事', question: '根据前面的情节，你能预测老屋的回应吗？读完后还能提出什么问题？',
  },
];

export const oldHousePredictionCases: OldHousePredictionCase[] = [
  {
    id: 'cat', title: '第一处', visitor: '小猫',
    knownSummary: oldHouseStoryStops[1].knownSummary,
    evidence: [
      { id: 'cat-weather', text: '小猫在暴风雨中找不到安心睡觉的地方。', source: '课文线索' },
      { id: 'cat-old-house', text: '老屋很破旧，刚刚说自己到了倒下的时候。', source: '课文线索' },
      { id: 'cat-help-experience', text: '生活中，遇到别人需要避雨时，有人会愿意帮忙。', source: '生活经验' },
      { id: 'cat-unrelated', text: '我今天的书包是蓝色的。', source: '无关线索' },
    ],
    predictions: [
      { id: 'cat-help', text: '老屋可能会让小猫进来，等到明天。', basisIds: ['cat-weather', 'cat-help-experience'], supported: true, explanation: '小猫需要避雨和休息，再联系帮助别人的生活经验，可以这样猜；仍要继续读才能知道老屋的回应。' },
      { id: 'cat-rest', text: '老屋可能先说自己很累，不能再等。', basisIds: ['cat-old-house'], supported: true, explanation: '老屋破旧又想倒下，这能支持担心它无法继续等待的猜想；读到新内容时可以修改。' },
      { id: 'cat-new-building', text: '老屋一定马上变成一座新楼。', basisIds: [], supported: false, explanation: '现在的线索没有提到重建或变化成新楼；说一定也超过了已知信息。试着用一条相关线索解释自己的猜想。' },
    ],
    outcomeSummary: oldHouseStoryStops[1].outcomeSummary,
    compareNote: '把原来的猜想和读到的回应放在一起。可以相同，也可以不同；说说你用了什么线索，新内容让你怎样调整。',
    teachingNote: '第一处由教师示范：我看到什么，因此我猜什么。生活经验能提供可能性，不能把还没读到的回应说成确定事实。',
  },
  {
    id: 'hen', title: '第二处', visitor: '老母鸡',
    knownSummary: oldHouseStoryStops[2].knownSummary,
    evidence: [
      { id: 'hen-previous-help', text: '前面老屋答应过小猫，等它住了一夜再离开。', source: '课文线索' },
      { id: 'hen-eggs', text: '老母鸡需要一个安心孵蛋的地方。', source: '课文线索' },
      { id: 'hen-rest', text: '小猫离开后，老屋又准备倒下。', source: '课文线索' },
      { id: 'hen-time-experience', text: '孵蛋需要持续一段时间，等待可能比一夜更久。', source: '生活经验' },
    ],
    predictions: [
      { id: 'hen-help', text: '老屋可能还会答应，等母鸡孵蛋。', basisIds: ['hen-previous-help', 'hen-eggs'], supported: true, explanation: '前一次回应让我们看到老屋愿意帮助别人；结合母鸡的需要，可以预测它还会帮忙。' },
      { id: 'hen-hesitate', text: '老屋可能会犹豫，先问需要等多久。', basisIds: ['hen-rest', 'hen-time-experience'], supported: true, explanation: '老屋又想倒下，孵蛋还需要时间，可以据此猜它会犹豫；这也是一个等待后文验证的可能。' },
      { id: 'hen-travel', text: '老屋一定带着母鸡去坐火车。', basisIds: [], supported: false, explanation: '已读到的内容没有出行、火车等线索；需要补充和此处情节相关的依据，才能让猜想更有说服力。' },
    ],
    outcomeSummary: oldHouseStoryStops[2].outcomeSummary,
    compareNote: '老屋的回应让前面的帮助情节再次出现。猜到别的回应也可以回顾理由，再把新的情节加入自己的理解。',
    teachingNote: '第二处让学生借助前面的人物表现和生活经验提出不同预测。追问依据是否贴合这次请求，不用是否猜中给预测排名。',
  },
  {
    id: 'spider', title: '第三处', visitor: '小蜘蛛',
    knownSummary: oldHouseStoryStops[3].knownSummary,
    evidence: [
      { id: 'spider-pattern', text: '老屋已经两次在收到请求后继续等待。', source: '课文线索' },
      { id: 'spider-need', text: '小蜘蛛很饿，需要在屋里织网抓虫。', source: '课文线索' },
      { id: 'spider-rest', text: '老屋又准备倒下，似乎还想结束等待。', source: '课文线索' },
      { id: 'spider-time-experience', text: '织网和等虫子来到网上需要时间，完成时间可能不确定。', source: '生活经验' },
    ],
    predictions: [
      { id: 'spider-help', text: '老屋可能继续等，让小蜘蛛先织网。', basisIds: ['spider-pattern', 'spider-need'], supported: true, explanation: '前面重复的帮助情节和蜘蛛的困难共同支持这个猜想；重复出现的情节也是预测的线索。' },
      { id: 'spider-time', text: '老屋可能先问小蜘蛛什么时候能完成。', basisIds: ['spider-rest', 'spider-time-experience'], supported: true, explanation: '老屋想结束等待，而蜘蛛完成事情所需的时间未定，可以据此提出另一个有依据的猜想。' },
      { id: 'spider-forever', text: '老屋此后永远都不会倒下，肯定如此。', basisIds: [], supported: false, explanation: '此处还没读到后文，不能由前面两次等待确定所有未来。可以改成有理由的可能，并继续读。' },
    ],
    outcomeSummary: oldHouseStoryStops[3].outcomeSummary,
    compareNote: '课文结尾写到老屋仍在听故事，留下继续想象的空间。它以后一定怎样，课文没有全部写明；续编时可以提出合理的可能。',
    teachingNote: '区分已经写明的结尾与此后的想象。人物愿意帮助别人可由多次回应说明；永远不会倒下属于超出当前文本的断言。',
  },
];

export const oldHouseMethodTips = [
  { id: 'basis', title: '先说看到的线索', body: '从题目、已经读到的情节和相关生活经验找理由。用“我看到……，所以我猜可能……”说清楚。' },
  { id: 'compare', title: '读后文，再比较', body: '保留原来的猜想，读到新内容后比较。说说哪些想法得到支持，哪些需要调整，为什么。' },
  { id: 'possibilities', title: '可以有不同的合理猜想', body: '同一处可以猜出不同的发展。听听每个人的理由，检查线索与猜想的联系；结局相同或不同都值得讨论。' },
];

// Entirely original transfer scene, deliberately unrelated to textbook word
// requirements; it reuses the same reason / read-on comparison vocabulary.
export const oldHouseTransferCase: OldHousePredictionCase = {
  id: 'transfer', title: '操场边的花盆', visitor: '值日生',
  knownSummary: '午后太阳出来了。值日生发现花盆里的土很干，拿起了旁边的水壶。接下来可能发生什么？',
  evidence: [
    { id: 'transfer-dry', text: '花盆里的土很干。', source: '情境线索' },
    { id: 'transfer-kettle', text: '值日生拿起了水壶。', source: '情境线索' },
    { id: 'transfer-care', text: '照料花草时，可以先看看土的干湿，再决定是否浇水。', source: '生活经验' },
  ],
  predictions: [
    { id: 'transfer-water', text: '值日生可能会给花浇水。', basisIds: ['transfer-dry', 'transfer-kettle'], supported: true, explanation: '土干和拿水壶都与浇水有关，这个猜想有相关线索。' },
    { id: 'transfer-check', text: '值日生可能先检查一下花盆里的土。', basisIds: ['transfer-dry', 'transfer-care'], supported: true, explanation: '结合照料花草的经验，可以猜值日生会先确认土的干湿程度。' },
    { id: 'transfer-rain', text: '明天一定会下雨。', basisIds: [], supported: false, explanation: '土干、拿水壶不能确定明天的天气，需要与天气有关的新信息。' },
  ],
  outcomeSummary: '值日生摸了摸花盆里的土，确认干了，然后给花浇了水。',
  compareNote: '后文把先检查和再浇水连在一起。两种猜想都能找到依据，也可能描述同一件事的不同环节。',
  teachingNote: '这是本项目原创的小情境，不属于教材课文。可口头说理由，不增加必会字词和书面作业要求。',
};
