import { pilotLessons } from './chinesePilot';

const poem = pilotLessons.find(lesson => lesson.courseId === 'cn-04')?.recitation.poems.find(poem => poem.id === 'shan-xing');
if (!poem) throw new Error('《山行》原文缺失');

export const shanxing = {
  ...poem,
  lines: poem.lines.map((line, index) => ({
    ...line,
    meaning: [
      '石头小路斜斜地向深秋的山上延伸。',
      '在生出白云的地方，能看见几户人家。',
      '因为喜欢傍晚的枫林，我停下车来。',
      '经霜的枫叶，比二月的春花更红。',
    ][index],
    focus: ['石径向上', '白云人家', '驻足枫林', '霜叶更红'][index],
    clue: ['远上 · 石径', '白云 · 人家', '停车 · 枫林', '霜叶 · 春花'][index],
    note: [
      '寒山：深秋时节的山。石径：石头小路。',
      '“生处”是白云生起的地方；课本这里用“生”。',
      '坐：因为。晚：傍晚。诗人因为喜爱枫林而停车。',
      '于：比。“红于”是比……更红，不是一样红。',
    ][index],
  })),
};

export const shanxingWords = [
  { character: '寒', pinyin: 'hán', words: ['寒冷', '寒风'], context: '寒山', tip: '“寒山”写深秋的山，诗里没有说是雪山。', shape: '上面是宝盖头，下面的两点别漏掉。' },
  { character: '径', pinyin: 'jìng', words: ['小径', '路径'], context: '石径', tip: '“石径”就是石头小路。', shape: '左边是双人旁“彳”，不要写成单人旁。' },
  { character: '斜', pinyin: 'xié', words: ['倾斜', '斜坡'], context: '石径斜', tip: '按普通话读 xié，不为了押韵改读 xiá。', shape: '右边是“斗”。先看清左右两部分，再写。' },
  { character: '枫', pinyin: 'fēng', words: ['枫叶', '枫树'], context: '枫林', tip: '“枫林”是一片枫树。', shape: '左边是木字旁，右边是“风”。' },
  { character: '霜', pinyin: 'shuāng', words: ['秋霜', '霜冻'], context: '霜叶', tip: '“霜叶”在这里指经霜的枫叶。', shape: '上面是雨字头，下面是“相”。' },
];

export const shanxingChecks = [
  { id: 'sheng', prompt: '白云 __ 处有人家。', options: ['生', '深'], answer: '生', reason: '按这本教材，原句是“白云生处有人家”。' },
  { id: 'zuo', prompt: '停车 __ 爱枫林晚。', options: ['座', '坐'], answer: '坐', reason: '“坐”在这句里表示“因为”，原句不用“座”。' },
];

export const shanxingSources = [
  { title: '官方同步课 · 第4课《古诗三首》', description: '国家智慧教育平台，新教材，两课时。视频与课件需要登录；本案例未复制课程视频。', url: 'https://basic.smartedu.cn/syncClassroom/classActivity?activityId=d2456be1-b25b-b957-97d5-54af93639ff0&chapterId=39844695-7085-47e0-afdc-13c6f5fd67f4&teachingmaterialId=22707f9a-a593-44a7-89ee-3f4d78905f2e&fromPrepare=0&classHourId=lesson_1' },
  { title: '短讲补充 · 第4课《古诗三首》', description: '豌豆老师大语文，6分55秒，讲三首诗。目录匹配新版；不是仅讲《山行》的独立视频。', url: 'https://www.bilibili.com/video/BV1w1pMzNEiu/' },
  { title: '人教范写 · “径”', description: '出版社写字示范，供观察字形与写法。', url: 'https://www.pep.com.cn/jxzy/xzzq/xzsp/tbxz/3s/202110/t20211020_1971253.html' },
  { title: '人教解释 · 为什么是“白云生处”', description: '教材采用“生”字的说明，供家长核对。', url: 'https://www.pep.com.cn/xw/zt/hd/zjywjytbskjc/201905/t20190516_1938202.html' },
  { title: '新版教材修订要点', description: '官方教材解读，包含八单元的阅读与习作目标。', url: 'https://www.pep.com.cn/bks/xxyw/jzjd/202510/W020251016516675066625.pdf' },
];
