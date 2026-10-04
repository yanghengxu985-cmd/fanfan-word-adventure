export type MeadowTimeId = 'morning' | 'noon' | 'evening';
export type MeadowFlowerStateId = 'closed' | 'open';

export type MeadowRecognitionFocusItem = {
  character: string;
  pinyin: string;
  parts: string;
  attention: string;
  words: string[];
  meaning: string;
};

export type MeadowWritingFocusItem = MeadowRecognitionFocusItem & {
  distinguish?: string;
};

export type MeadowWordFocusItem = {
  text: string;
  pinyin: string;
  meaning: string;
  attention: string;
  example: string;
};

export type MeadowLessonCopy = {
  title: string;
  intro: string;
  observationTimes: {
    id: MeadowTimeId;
    label: string;
    timeHint: string;
    grassColour: string;
    flowerState: MeadowFlowerStateId;
    flowerLabel: string;
    description: string;
    evidence: string;
    question: string;
    answer: string;
  }[];
  flowerStates: {
    id: MeadowFlowerStateId;
    label: string;
    appearance: string;
    reason: string;
  }[];
  readingPrompts: {
    id: string;
    question: string;
    choices: { text: string; correct: boolean; explanation: string }[];
  }[];
  writingFocus: MeadowWritingFocusItem[];
  sources: { title: string; url: string }[];
};

// The scope follows cn-15 in the existing 2025-preview-based semester plan.
// These manually checked coaching readings do not promote the plan's
// readingVerified / paperVerified flags or add recitation requirements.
export const meadowLessonRequirementNote =
  '字词范围参照项目采用的2025新版公开预览：会认6字、会写13字、词语11个；辅导拼音另经字典人工核对，不改变全册核验状态。2026纸本正文、课后题及背诵、默写要求仍待核对，以纸本为准。本页说明、例句和练习为原创辅助，请结合完整课文阅读。画面演示课文中的这次观察，不规定所有花朵每天在固定钟点开合；生活观察须如实记录，不根据动画补写没有看到的内容。';

// Recognition supports reading, not an additional writing assignment. Five
// characters also occur in the writing list; 茸 remains recognition-only.
export const meadowRecognitionFocus: MeadowRecognitionFocusItem[] = [
  {
    character: '蒲',
    pinyin: 'pú',
    parts: '上面是草字头，下面是“浦”字形：左边三点水，右边“甫”。',
    attention: '读 pú，第二声；“蒲公英”的“蒲”和“普通”的“普”声调不同。',
    words: ['蒲公英'],
    meaning: '在植物名“蒲公英”中认读；课文观察的是草地上的蒲公英。',
  },
  {
    character: '英',
    pinyin: 'yīng',
    parts: '上面是草字头，下面是“央”字形。',
    attention: '读 yīng，第一声，后鼻音 ing；和“蒲、公”连起来读植物名。',
    words: ['蒲公英', '英雄'],
    meaning: '这里是植物名“蒲公英”的一部分；“英雄”中的“英”指才能出众。',
  },
  {
    character: '耍',
    pinyin: 'shuǎ',
    parts: '上面是“而”字形，下面是“女”。',
    attention: '读 shuǎ，第三声，翘舌音 sh；“耍”和“要”下部相同，上部不同。',
    words: ['玩耍'],
    meaning: '游戏、玩乐；课文写兄弟俩在草地上玩耍。',
  },
  {
    character: '茸',
    pinyin: 'róng',
    parts: '上面是草字头，下面是“耳”字形。',
    attention: '“茸毛”的“茸”读 róng，第二声、后鼻音 ong；“茸”和“绒”同音，偏旁不同。',
    words: ['茸毛'],
    meaning: '细而柔软的毛；这里联系蒲公英的茸毛认读。',
  },
  {
    character: '欠',
    pinyin: 'qiàn',
    parts: '独体字，先看上面的短撇和横撇，再看下面的撇、捺。',
    attention: '单字读 qiàn，第四声、前鼻音 ian；放回“打哈欠”的语境认读。',
    words: ['打哈欠', '欠缺'],
    meaning: '“打哈欠”指张口深吸气再呼气的动作；在“欠缺”中表示不足。',
  },
  {
    character: '拢',
    pinyin: 'lǒng',
    parts: '左边是提手旁，右边是“龙”字形。',
    attention: '读 lǒng，第三声、后鼻音 ong；“拢”和“扰”都有提手旁，要看清右边的“龙”和“尤”。',
    words: ['合拢', '收拢'],
    meaning: '合上或聚在一起；这里指花朵合拢的状态。',
  },
];

// Exactly the existing 11 textbook words. The examples are original coaching
// sentences, not textbook quotations or additional required vocabulary.
export const meadowWordFocus: MeadowWordFocusItem[] = [
  {
    text: '草地',
    pinyin: 'cǎo dì',
    meaning: '长着草的一片地方。',
    attention: '“草”读 cǎo，平舌音 c；课文写草地远看显出的颜色，要再看花朵找原因。',
    example: '我先看草地的颜色，再走近看花朵。',
  },
  {
    text: '蒲公英',
    pinyin: 'pú gōng yīng',
    meaning: '本课观察的植物名称。',
    attention: '“蒲”读第二声；“公”和“英”都是后鼻音，分别是 ong 和 ing。',
    example: '我在不同时段观察同一片蒲公英。',
  },
  {
    text: '盛开',
    pinyin: 'shèng kāi',
    meaning: '花开得茂盛。',
    attention: '这里“盛”读 shèng，后鼻音；“盛饭”的“盛”读 chéng。',
    example: '盛开的花朵显露出金色。',
  },
  {
    text: '玩耍',
    pinyin: 'wán shuǎ',
    meaning: '做游戏、玩乐。',
    attention: '“玩”是前鼻音 an；“耍”是翘舌音 sh，不要读成“要”。',
    example: '玩耍时，我也留意身边的新发现。',
  },
  {
    text: '一本正经',
    pinyin: 'yī běn zhèng jīng',
    meaning: '态度或样子很认真、很庄重。',
    attention: '拼音按词典标本调；连读时“一”在第三声“本”前读 yì。课文中要结合装出认真的样子来理解。',
    example: '弟弟一本正经地宣布游戏开始了。',
  },
  {
    text: '使劲',
    pinyin: 'shǐ jìn',
    meaning: '用力气。',
    attention: '“使”读 shǐ，翘舌音；“劲”读 jìn，前鼻音 in。',
    example: '我使劲吹了一口气，纸风车转了起来。',
  },
  {
    text: '钓鱼',
    pinyin: 'diào yú',
    meaning: '用钓竿、钩和饵捕鱼。',
    attention: '“钓”读 diào，第四声；它右边是“勺”，和“钩”的右边不同。',
    example: '去钓鱼的路上，我发现草地的颜色与以前不同。',
  },
  {
    text: '观察',
    pinyin: 'guān chá',
    meaning: '仔细地看，留意事物的特点和变化。',
    attention: '“观”是前鼻音 an，“察”是翘舌音 ch；记下看到的现象，原因还要找依据。',
    example: '我连续观察，把每次的时间和发现写下来。',
  },
  {
    text: '合拢',
    pinyin: 'hé lǒng',
    meaning: '合在一起或合上。',
    attention: '“拢”读 lǒng；这里看花朵怎样合上，不把“合拢”说成花瓣变绿。',
    example: '花朵合拢时，金色的花瓣被包在里面。',
  },
  {
    text: '张开',
    pinyin: 'zhāng kāi',
    meaning: '从合拢的状态展开。',
    attention: '“张”读 zhāng，翘舌音、后鼻音 ang；与“合拢”对照着理解状态变化。',
    example: '花朵张开后，金色的花瓣显露出来。',
  },
  {
    text: '喜爱',
    pinyin: 'xǐ ài',
    meaning: '喜欢、爱好。',
    attention: '“喜”读 xǐ，第三声；说喜爱一种事物时，可以用自己发现的细节说明理由。',
    example: '新的发现让我更加喜爱这片草地。',
  },
];

export const meadowLessonCopy: MeadowLessonCopy = {
  title: '金色的草地',
  intro: '同一片草地，为什么有时显绿、有时显金色？跟着作者在不同时段看草地，再走近看花朵，把看到的变化和解释变化的依据分开说清。',
  observationTimes: [
    {
      id: 'morning',
      label: '早晨',
      timeHint: '作者起得很早时',
      grassColour: '绿色',
      flowerState: 'closed',
      flowerLabel: '花朵合拢',
      description: '这次早起，作者发现草地显绿色，与以前看到的金色不同。先记下这一现象，再带着疑问继续看。',
      evidence: '在纸本中找早起时草地颜色的描写，作为这条观察的依据。',
      question: '发现草地显绿，就能说金色花瓣变绿了吗？还要看哪里？',
      answer: '还要走近看花朵。合拢的花朵把金色花瓣包住了；草地显绿，不等于金色花瓣变成绿色。',
    },
    {
      id: 'noon',
      label: '中午',
      timeHint: '作者回家时',
      grassColour: '金色',
      flowerState: 'open',
      flowerLabel: '花朵张开',
      description: '中午再看，同一片草地显金色。把这次与早晨的观察对照，发现颜色和时间有联系。',
      evidence: '在纸本中找中午回家时的颜色描写，再找花朵张开时的说明。',
      question: '走近看花朵，哪一处变化能解释草地为什么显金色？',
      answer: '花朵张开，金色的花瓣显露出来。许多这样的花朵让草地远看显金色，不是草叶全部变成了金色。',
    },
    {
      id: 'evening',
      label: '傍晚',
      timeHint: '作者再次看草地时',
      grassColour: '绿色',
      flowerState: 'closed',
      flowerLabel: '花朵合拢',
      description: '傍晚，草地又显绿色。作者还走近仔细看花朵，把远处看到的颜色与近处看到的状态联系起来。',
      evidence: '在纸本中找傍晚颜色的变化和仔细观察花朵的内容，核对现象与解释。',
      question: '为什么要把早晨、中午、傍晚的观察放在一起看？',
      answer: '一次观察只能告诉我们当时的样子。比较三个时段，再看花朵张开、合拢的状态，才能把这次变化和找到的原因说清楚。',
    },
  ],
  flowerStates: [
    {
      id: 'closed',
      label: '合拢',
      appearance: '花朵合上，金色的花瓣被包住。',
      reason: '显露在外的金色减少，草地远看显绿色。可以合上手掌，帮助理解“合拢”的意思。',
    },
    {
      id: 'open',
      label: '张开',
      appearance: '花朵展开，金色的花瓣显露出来。',
      reason: '许多金色花瓣显露出来，草地远看显金色。可以展开手掌，与合拢时对照。',
    },
  ],
  readingPrompts: [
    {
      id: 'meadow-time-observations',
      question: '按课文中这次观察，哪条记录把三个时段的草地颜色对应准确？',
      choices: [
        {
          text: '早晨绿色，中午金色，傍晚又是绿色。',
          correct: true,
          explanation: '三个时段与颜色一一对应。请回到纸本逐项找依据，再说清同一片草地出现了怎样的变化。',
        },
        {
          text: '早晨金色，中午绿色，傍晚又是金色。',
          correct: false,
          explanation: '注意到了颜色在变化，但把三个时段的颜色对应反了。按时间分别找颜色，不能只凭“金色的草地”这个题目作答。',
        },
        {
          text: '早晨绿色，中午金色，傍晚还是金色。',
          correct: false,
          explanation: '前两次记录对应准确，傍晚的变化漏掉了。连续观察时，后一次出现的新变化也要如实记下。',
        },
      ],
    },
    {
      id: 'meadow-flower-cause',
      question: '哪条说明把看到的花朵状态与草地颜色联系起来，解释了这次变化？',
      choices: [
        {
          text: '早晨草地绿，中午草地金，傍晚又绿；这就是颜色变化的原因。',
          correct: false,
          explanation: '这条把看到的现象重复了一遍，还没有解释原因。要继续说花朵怎样变化、金色花瓣怎样显露或被包住。',
        },
        {
          text: '花朵张开，金色花瓣显露；花朵合拢，金色花瓣被包住，所以远看颜色不同。',
          correct: true,
          explanation: '近处看到的花朵状态解释了远处看到的颜色。作者既比较了不同时间，也走近看细节，这两种观察一起支持解释。',
        },
        {
          text: '花朵张开时花瓣是金色，合拢时花瓣变成绿色，所以草地颜色也变了。',
          correct: false,
          explanation: '把草地显出的绿色当成了花瓣本身的变色。课文找到的是金色花瓣显露或被包住的变化，不能把“看不到金色”写成“花瓣变绿”。',
        },
      ],
    },
    {
      id: 'meadow-evidence-record',
      question: '原创观察练习：今天三次看同一株植物，早晨叶片上有小水珠，中午和傍晚没见到；原因还没查明。哪条记录合适？',
      choices: [
        {
          text: '早晨没有水珠，中午有水珠，傍晚又没有；原因还没查明。',
          correct: false,
          explanation: '保留了原因待查，但把早晨和中午的现象对应错了。先核对每次的时间与所见，再寻找变化的原因。',
        },
        {
          text: '早晨有水珠，中午和傍晚没有；说明水珠一定被风吹走了。',
          correct: false,
          explanation: '时间和现象记录准确，但没有观察到风怎样使水珠消失。可能的解释要和已看到的事实分开，不能写成已经证实。',
        },
        {
          text: '早晨有水珠，中午和傍晚没见到；水珠怎样消失还要继续观察。',
          correct: true,
          explanation: '把同一对象在不同时间的现象写清楚，也保留了还不知道的原因。观察身边的事物时，可以用自己的几句话记录，并继续寻找依据。',
        },
      ],
    },
  ],
  // All 13 entries belong to cn-15's existing writing list. Parts describe
  // the modern visible form, not speculative character origins.
  writingFocus: [
    {
      character: '蒲',
      pinyin: 'pú',
      parts: '上下结构：上面艹，下面“浦”字形，里面有氵和甫。',
      attention: '草字头下的三点水不能漏；“甫”右上方的一点也要写出。',
      words: ['蒲公英', '蒲扇'],
      meaning: '在植物名“蒲公英”中使用；“蒲扇”是用蒲葵等植物的叶做的扇子。',
      distinguish: '“蒲”下部是“浦”字形，不要再加“寸”写成“薄”。',
    },
    {
      character: '英',
      pinyin: 'yīng',
      parts: '上下结构：上面艹，下面央。',
      attention: '下面是“央”，中间没有封口的底横；最后的撇、捺要写清。',
      words: ['蒲公英', '英雄'],
      meaning: '这里是植物名中的一个字；在“英雄”中表示才能出众。',
      distinguish: '“英”下面是“央”；“黄”下面不同，不要把中间写成封口的“田”。',
    },
    {
      character: '盛',
      pinyin: 'shèng',
      parts: '上下结构：上面成，下面皿。',
      attention: '上部“成”的斜钩和末尾一点要写出；下部“皿”里面的两条短竖不能漏。盛开读 shèng。',
      words: ['盛开', '茂盛'],
      meaning: '“盛开”指花开得茂盛；“盛饭”中的“盛”读 chéng。',
      distinguish: '不要漏掉下部“皿”，把“盛”只写成“成”。',
    },
    {
      character: '耍',
      pinyin: 'shuǎ',
      parts: '上下结构：上面而，下面女。',
      attention: '上部“而”里面有两条短竖；下部“女”的末横写清，托住上部。',
      words: ['玩耍', '耍笑'],
      meaning: '玩乐、游戏；本课在“玩耍”中使用。',
      distinguish: '“耍”上面是“而”；“要”上面是“覀”字形，不要混写。',
    },
    {
      character: '使',
      pinyin: 'shǐ',
      parts: '左右结构：左边亻，右边吏。',
      attention: '右部中间是“口”字形，里面不要多加一横；单人旁写窄。',
      words: ['使劲', '使用'],
      meaning: '用；“使劲”就是用力气。',
      distinguish: '“使”的右边是“吏”，不是“更”；不要多加一横写成“便”。',
    },
    {
      character: '劲',
      pinyin: 'jìn',
      parts: '左右结构：左边与“经”的右部相同，右边是力。',
      attention: '右边是“力”，不要写成“刀”。使劲读 jìn，前鼻音 in；强劲读 jìng。',
      words: ['使劲', '有劲'],
      meaning: '力气；“使劲”表示用力。',
      distinguish: '“劲”右边是“力”；“经”左边是绞丝旁，位置和部件都不同。',
    },
    {
      character: '脸',
      pinyin: 'liǎn',
      parts: '左右结构：左边月，右边佥。',
      attention: '右部“人”下面的短横不能漏；下方是点、点、撇，最后一横托住它们。',
      words: ['脸上', '笑脸'],
      meaning: '面孔；课文写茸毛被吹到脸上。',
      distinguish: '“脸”用月字旁；“检”用木字旁，看清左边再写。',
    },
    {
      character: '欠',
      pinyin: 'qiàn',
      parts: '独体字，共四笔：撇、横撇、撇、捺。',
      attention: '第二笔是横撇；下面还有一撇和一捺，不能漏掉其中的一撇。',
      words: ['打哈欠', '欠缺'],
      meaning: '“打哈欠”中的动作；“欠缺”中表示不足。',
      distinguish: '“欠”有四笔；“久”有三笔，字形不同，不要凭相似轮廓混写。',
    },
    {
      character: '朝',
      pinyin: 'cháo',
      parts: '左右结构：左部从上到下是十、日、十，右边月。',
      attention: '左部“日”上下各有一个“十”，不要漏掉下方的“十”；本课“朝脸上吹”中的朝读 cháo。',
      words: ['朝着', '朝前'],
      meaning: '这里指向着、对着；表示早晨的“朝”读 zhāo，如朝霞。',
      distinguish: '“朝”的右部是“月”，不能换成“车”写成“韩”。',
    },
    {
      character: '钓',
      pinyin: 'diào',
      parts: '左右结构：左边钅，右边勺。',
      attention: '右部“勺”里面是一点；左边是金字旁，不是提手旁。',
      words: ['钓鱼', '垂钓'],
      meaning: '用钩和饵捕鱼。',
      distinguish: '“钓”右边是“勺”，里面一点；“钩”右边是“勾”，里面不同。',
    },
    {
      character: '察',
      pinyin: 'chá',
      parts: '上下结构：上面宀，下面祭；最下方是示字形。',
      attention: '宝盖头的一点不要漏；最下方“示”有两横，不要少写一横变成“小”。',
      words: ['观察', '察看'],
      meaning: '仔细地看，留意和了解事物。',
      distinguish: '“察”上面是宝盖头；“擦”左边是提手旁，观察用“察”。',
    },
    {
      character: '拢',
      pinyin: 'lǒng',
      parts: '左右结构：左边扌，右边龙。',
      attention: '右部“龙”右上方的一点不能漏；左边提手旁的末笔是提。',
      words: ['合拢', '收拢'],
      meaning: '合上或聚在一起；本课写花朵合拢。',
      distinguish: '“拢”右边是“龙”；“扰”右边是“尤”，不要漏掉“龙”里的那一撇。',
    },
    {
      character: '喜',
      pinyin: 'xǐ',
      parts: '上下结构：顶部是士，字中和字底各有一个口。',
      attention: '顶部“士”的上横长、下横短；两个“口”之间的点、撇和一横不能漏。',
      words: ['喜爱', '欢喜'],
      meaning: '喜欢或高兴；“喜爱”表示喜欢。',
      distinguish: '“喜”顶部是“士”，不是上横短、下横长的“土”。',
    },
  ],
  sources: [
    {
      title: '人教社教材编辑：观察单元从两篇精读课文走向观察与表达（2019，教学原则参考）',
      url: 'https://www.pep.com.cn/xw/zt/hd/zjywjytbskjc/201905/t20190516_1938221.html',
    },
    {
      title: '人教社2025修订说明：第五单元语文要素（不等同于2026纸本课后题核验）',
      url: 'https://www.pep.com.cn/bks/xxyw/jzjd/202510/W020251016516675066625.pdf',
    },
    {
      title: '项目采用的2025新版公开预览：字词范围参考（第三方展示，2026纸本待核）',
      url: 'https://www.scribd.com/document/1067004050/%E4%BA%BA%E6%95%99%E7%89%88-%E4%B8%89%E5%B9%B4%E7%BA%A7%E4%B8%8A%E5%86%8C-2025%E7%A7%8B%E7%89%88-%E8%AF%AD%E6%96%87%E7%94%B5%E5%AD%90%E8%AF%BE%E6%9C%AC',
    },
    ...['蒲', '英', '耍', '茸', '欠', '拢', '盛', '使', '劲', '脸', '朝', '钓', '察', '喜'].map(character => ({
      title: `汉典：${character}的现代字音、字形与释义（辅导核对）`,
      url: `https://www.zdic.net/hans/${encodeURIComponent(character)}`,
    })),
    {
      title: '汉典：一本正经的读音与词义',
      url: 'https://www.zdic.net/hans/%E4%B8%80%E6%9C%AC%E6%AD%A3%E7%BB%8F',
    },
  ],
};
