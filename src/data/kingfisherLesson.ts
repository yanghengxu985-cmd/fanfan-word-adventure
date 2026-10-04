export type BirdObservationPartId = 'feathers' | 'wings' | 'beak';
export type BirdVerbId = 'chong' | 'fei' | 'xian' | 'zhan' | 'tun';

export type BirdRecognitionFocusItem = {
  character: string;
  pinyin: string;
  parts: string;
  attention: string;
  words: string[];
  meaning: string;
};

export type BirdLessonCopy = {
  title: string;
  intro: string;
  observationParts: {
    id: BirdObservationPartId;
    label: string;
    colour: string;
    description: string;
    question: string;
    answer: string;
  }[];
  verbs: {
    id: BirdVerbId;
    character: string;
    at: number;
    meaning: string;
    evidence: string;
    note: string;
  }[];
  readingPrompts: {
    id: string;
    question: string;
    choices: { text: string; correct: boolean; explanation: string }[];
  }[];
  writingFocus: {
    character: string;
    pinyin: string;
    parts: string;
    attention: string;
    words: string[];
    distinguish?: string;
  }[];
  sources: { title: string; url: string }[];
};

// This note preserves the project's distinction between preview evidence and
// the user's 2026 paper copy. The exercise copy below is original guidance.
export const birdLessonRequirementNote =
  '字词范围参照项目采用的2025新版公开预览；2026纸本课后要求尚待核对，背诵和默写范围以纸本为准。本页分镜、释义与练习为原创辅助，请结合完整课文阅读。';

// These manually checked readings supplement this lesson's recognition cards.
// They do not change semester-wide readingVerified flags or writing requirements.
// The preview's lesson text supplies the contexts; ZDIC's modern dictionary
// entries cross-check each reading and distinguish lā (sound) from la (particle).
export const birdRecognitionFocus: BirdRecognitionFocusItem[] = [
  {
    character: '舱',
    pinyin: 'cāng',
    parts: '左边是舟字旁，右边是“仓”字形。',
    attention: '读 cāng，第一声、后鼻音 ang；“舱”和“仓”同音，船舱的“舱”有舟字旁。',
    words: ['船舱'],
    meaning: '船内供人乘坐或存放东西的空间；课文里“我”和母亲坐在船舱中。',
  },
  {
    character: '啦',
    pinyin: 'lā',
    parts: '左边是“口”，右边是“拉”字形，帮助联系声音。',
    attention: '课内“沙啦沙啦”读 shā lā shā lā，啦是第一声；“来啦”中的句末语气词啦读轻声 la。',
    words: ['沙啦沙啦', '哗啦'],
    meaning: '这里用在拟声词中，模仿雨点打在船篷上的声音。',
  },
  {
    character: '鹦',
    pinyin: 'yīng',
    parts: '左边是“婴”字形，右边的鸟字旁提示它与鸟有关。',
    attention: '读 yīng，第一声、后鼻音 ing；放进鸟名“鹦鹉 yīng wǔ”一起认读。',
    words: ['鹦鹉'],
    meaning: '和“鹉”组成鸟名“鹦鹉”；课文把翠鸟的样子与鹦鹉作比较。',
  },
  {
    character: '鹉',
    pinyin: 'wǔ',
    parts: '左边是“武”字形，右边也有鸟字旁。',
    attention: '读 wǔ，第三声，与“武”同音；和“鹦”连起来读 yīng wǔ。',
    words: ['鹦鹉'],
    meaning: '和“鹦”组成“鹦鹉”，是一种鸟的名称。',
  },
  {
    character: '衔',
    pinyin: 'xián',
    parts: '左、中、右三部分；“行”字形的中间有“钅”。',
    attention: '读 xián，第二声，韵母 ian 是前鼻音；放回“衔着小鱼”中认读，含住还不是吞下。',
    words: ['衔着小鱼', '衔住'],
    meaning: '用嘴含住；课文中指翠鸟的长嘴含着小鱼。',
  },
];

export const birdLessonCopy: BirdLessonCopy = {
  title: '搭船的鸟',
  intro: '跟着小船上的“我”，把翠鸟的样子看清，再追踪它捕鱼时的变化。找出作者看见了什么，又用了哪些词把它写清楚。',
  observationParts: [
    {
      id: 'feathers',
      label: '羽毛',
      colour: '翠绿',
      description: '先找到鸟身上的羽毛，留意作者写出的颜色。',
      question: '课文写羽毛是什么颜色？',
      answer: '翠绿。把“羽毛”和“翠绿”连起来，就知道这种颜色在什么部位。',
    },
    {
      id: 'wings',
      label: '翅膀',
      colour: '带着一些蓝色',
      description: '看翅膀时，既要注意颜色，也要留意“一些”写出的范围。',
      question: '能把课文的意思说成“翅膀全是蓝色”吗？',
      answer: '不能。作者只写翅膀带着一些蓝色，不能把看到的“一些”改成“全是”。',
    },
    {
      id: 'beak',
      label: '长嘴',
      colour: '红色',
      description: '这次观察有两个发现：嘴的颜色是红的，形状是长的。',
      question: '介绍嘴巴时，除了“红色”，还有哪个特点不能漏？',
      answer: '“长”。颜色和形状合在一起，别人才能更清楚地想象它的嘴。',
    },
  ],
  verbs: [
    {
      id: 'chong',
      character: '冲',
      at: 2.3,
      meaning: '突然、迅速地进入水中。',
      evidence: '留意“冲”和“一下子”。',
      note: '原创用词对比：换成“慢慢走进”，就丢掉了突然、迅速入水的意思。读到这里，可以用声音表现动作的快。',
    },
    {
      id: 'fei',
      character: '飞',
      at: 5.4,
      meaning: '从水里飞起来，重新出现在作者眼前。',
      evidence: '留意“飞”和“没一会儿”。',
      note: '鸟飞起时，作者已经看到嘴里的小鱼。“飞”和“衔”是同一画面里的两个观察，不是先飞起来、再去衔鱼。',
    },
    {
      id: 'xian',
      character: '衔',
      at: 6.3,
      meaning: '用嘴含住；这里是长嘴含着小鱼。',
      evidence: '留意“衔着”写出的嘴和鱼的关系。',
      note: '“衔”说明鱼在嘴里，已经捕到了；此时还没有写吞下。它也能与飞、站同时出现，是持续可见的状态。',
    },
    {
      id: 'zhan',
      character: '站',
      at: 10.5,
      meaning: '回到船头，立在那里。',
      evidence: '留意“站”写出的落脚位置。',
      note: '把地点“船头”也说清楚。作者先写它站在船头，接着才写吞鱼；嘴里的鱼还可以同时被看见。',
    },
    {
      id: 'tun',
      character: '吞',
      at: 12.5,
      meaning: '把嘴里的小鱼咽下去。',
      evidence: '留意“吞”和“一口”。',
      note: '“吞”比笼统的“吃”更清楚，写出了把鱼咽下去的动作。留意小鱼从嘴里可见到看不见的变化。',
    },
  ],
  readingPrompts: [
    {
      id: 'bird-appearance',
      question: '想按照课文给翠鸟涂色，哪张观察记录对应得准确？',
      choices: [
        {
          text: '羽毛翠绿；翅膀带着一些蓝色；长嘴红色。',
          correct: true,
          explanation: '三个部位都与课文的颜色对应，“一些”也保留了观察的范围。可以回到外形描写逐项核对。',
        },
        {
          text: '羽毛蓝色；翅膀带着一些翠绿；长嘴红色。',
          correct: false,
          explanation: '嘴的颜色对应了，但羽毛和翅膀的颜色对调了。把部位和颜色成对记录，才不容易混淆。',
        },
        {
          text: '羽毛翠绿；翅膀带着一些红色；长嘴蓝色。',
          correct: false,
          explanation: '羽毛对应了，但翅膀和长嘴的颜色对调了。不能凭“颜色很漂亮”的印象作答，要回到课文找依据。',
        },
      ],
    },
    {
      id: 'bird-precise-verb',
      question: '把“衔着小鱼”改成“带着小鱼”，最容易丢掉哪一处观察？',
      choices: [
        {
          text: '翠鸟从水面飞起来的动作。',
          correct: false,
          explanation: '飞起来的动作由“飞”写出。只换掉“衔”，主要变化在嘴和鱼的关系上。',
        },
        {
          text: '小鱼被长嘴含住的具体样子。',
          correct: true,
          explanation: '“衔”写明是用嘴含住；“带着”没有说清怎样带。准确的动词能保留作者看到的细节。',
        },
        {
          text: '翠鸟回到船头的落脚位置。',
          correct: false,
          explanation: '落脚位置要看“站”和“船头”。“衔”着重说明小鱼怎样留在嘴里。',
        },
      ],
    },
    {
      id: 'bird-observation-to-writing',
      question: '你看见小狗跑到球旁，低头叼球，转身跑回。哪条记录把这次观察写得清楚？',
      choices: [
        {
          text: '小狗跑来跑去，一会儿玩球，一会儿又回到我身边。',
          correct: false,
          explanation: '说出了大概活动，但“玩球”省掉了低头、叼球的细节。再选准确的动作词，别人更容易想出画面。',
        },
        {
          text: '小狗跑到球旁，低头叼起球，它一定想争第一名。',
          correct: false,
          explanation: '前面的动作有观察依据，但“想争第一名”是猜想，还漏掉了转身跑回。记录时先把看见的动作写清楚。',
        },
        {
          text: '小狗跑到球旁，低头叼起球，转身跑了回来。',
          correct: true,
          explanation: '抓住跑、低头、叼、转身等动作，把看到的过程连起来。接下来可以观察身边的事物，用自己的几句话记录。',
        },
      ],
    },
  ],
  // All entries belong to cn-14's existing writing list. Word examples are
  // grouping guidance, not additional required textbook vocabulary.
  writingFocus: [
    {
      character: '搭',
      pinyin: 'dā',
      parts: '左右结构：左边扌，右边上面艹、下面合。',
      attention: '左窄右宽；右下是“合”，中间的一横不能漏。',
      words: ['搭船', '搭车'],
      distinguish: '“搭”是提手旁；“塔”是提土旁。搭船用“搭”。',
    },
    {
      character: '亲',
      pinyin: 'qīn',
      parts: '上下结构：上部是“立”字形，下部像“木”，末笔改为点。',
      attention: '最后两笔是撇、点；右下的点不要写成捺。母亲的“亲”读 qīn。',
      words: ['母亲', '亲人'],
      distinguish: '“亲”下部有撇和点；“辛”下部是“十”，没有这两笔。',
    },
    {
      character: '祖',
      pinyin: 'zǔ',
      parts: '左右结构：左边礻，右边且。',
      attention: '左边是示字旁“礻”，不要多写成衣字旁“衤”；右边“且”的末横托住上部。',
      words: ['外祖父', '祖国'],
      distinguish: '“祖”用礻；“组”用纟。两字右边都是“且”。',
    },
    {
      character: '披',
      pinyin: 'pī',
      parts: '左右结构：左边扌，右边皮。',
      attention: '右边“皮”的横钩和下部撇、捺要看清；披着衣服的“披”是提手旁。',
      words: ['披着', '披风'],
      distinguish: '“披”用扌；“被”用衤。披风的“披”不要写成“被”。',
    },
    {
      character: '摇',
      pinyin: 'yáo',
      parts: '左右结构：左边扌，右边上面爫、下面缶。',
      attention: '右上是爪字头，右下是“缶”；先看清上下两部分，再遮住独立写。',
      words: ['摇橹', '摇头'],
      distinguish: '“摇”右下是“缶”，不要写成“由”。',
    },
    {
      character: '停',
      pinyin: 'tíng',
      parts: '左右结构：左边亻，右边亭。',
      attention: '右边“亭”中间有“口”，口下面还有冖；下面“丁”的竖钩写在中间。',
      words: ['停止', '停下'],
      distinguish: '“停”比“亭”多单人旁；停止用“停”，亭子用“亭”。',
    },
    {
      character: '羽',
      pinyin: 'yǔ',
      parts: '左右两部分，每部分都有横折钩、点和提。',
      attention: '每边先写横折钩，再写点、提；两个横折钩都要写出钩。',
      words: ['羽毛', '羽毛球'],
      distinguish: '独立的“羽”有钩；“翠”上面的羽字头不写钩，要分别观察。',
    },
    {
      character: '翠',
      pinyin: 'cuì',
      parts: '上下结构：上部是变形的羽字形，下部是“卒”字形。',
      attention: '上部两笔横折都不带钩；下部两组“撇、点”都要写出，末尾还有横、竖。',
      words: ['翠绿', '翠鸟'],
      distinguish: '独立的“羽”有钩；“翠”上部的两笔横折没有钩。先对照，再独立写。',
    },
    {
      character: '蓝',
      pinyin: 'lán',
      parts: '上下结构：上面艹，下面监。',
      attention: '下方“皿”的两条短竖要写出，最后一横平稳地托住全字。',
      words: ['蓝色', '蓝天'],
      distinguish: '颜色用草字头“蓝”；篮子用竹字头“篮”。',
    },
    {
      character: '静',
      pinyin: 'jìng',
      parts: '左右结构：左边青，右边争。',
      attention: '右边是“争”；中间一横向右伸，最后的竖钩居中。',
      words: ['静悄悄', '安静'],
      distinguish: '“静”左边是“青”；“净”左边是两点水。安静用“静”。',
    },
    {
      character: '悄',
      pinyin: 'qiāo',
      parts: '左右结构：左边忄，右边肖。',
      attention: '竖心旁写窄；“静悄悄”的“悄”读 qiāo，“悄然”的“悄”读 qiǎo。',
      words: ['静悄悄', '悄悄'],
      distinguish: '“悄”用忄；“消”用氵。注意左边部件，不只看相同的右边。',
    },
    {
      character: '吞',
      pinyin: 'tūn',
      parts: '上下结构：上面天，下面口。',
      attention: '上部“天”的第一笔是横；下面“口”稍扁，放在撇、捺之间的下方。',
      words: ['吞下', '吞咽'],
      distinguish: '“吞”上部是“天”；“夭”的第一笔是撇，不要混写。',
    },
    {
      character: '捕',
      pinyin: 'bǔ',
      parts: '左右结构：左边扌，右边甫。',
      attention: '右边“甫”右上方的一点不能漏；“捕鱼”的“捕”读 bǔ，声母是 b。',
      words: ['捕鱼', '捕捉'],
      distinguish: '“捕”用扌；“铺”用钅。捕鱼用“捕”。',
    },
  ],
  sources: [
    {
      title: '人教社教材编辑：观察单元怎样从阅读走向表达',
      url: 'https://www.pep.com.cn/xw/zt/hd/zjywjytbskjc/201905/t20190516_1938221.html',
    },
    {
      title: '人教社《小学语文》：以捕鱼动词理解与迁移为例',
      url: 'https://www.pep.com.cn/bks/xxyw/jzjd/202505/W020250531413258927110.pdf',
    },
    {
      title: '项目采用的2025新版公开预览：本课与写字表',
      url: 'https://www.scribd.com/document/1067004050/%E4%BA%BA%E6%95%99%E7%89%88-%E4%B8%89%E5%B9%B4%E7%BA%A7%E4%B8%8A%E5%86%8C-2025%E7%A7%8B%E7%89%88-%E8%AF%AD%E6%96%87%E7%94%B5%E5%AD%90%E8%AF%BE%E6%9C%AC',
    },
    {
      title: '汉典现代字形与笔顺：“亲”的末笔是点',
      url: 'https://zdic.net/hans/%E4%BA%B2',
    },
    {
      title: '人教社生字书写视频：吞',
      url: 'https://www.pep.com.cn/jxzy/xzzq/xzsp/tbxz/3s/202110/t20211020_1971245.html',
    },
    ...birdRecognitionFocus.map(item => ({
      title: `汉典字音与释义核对：${item.character}`,
      url: `https://zdic.net/hans/${encodeURIComponent(item.character)}`,
    })),
  ],
};
