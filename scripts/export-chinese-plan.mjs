import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const projectRoot = new URL('../', import.meta.url)
const file = (path) => new URL(path, projectRoot)
const readJson = (path) => JSON.parse(readFileSync(file(path), 'utf8'))
const inventory = readJson('src/data/inventory.json')
const pilotPath = 'src/data/chinesePilot.json'
const pilot = existsSync(file(pilotPath)) ? readJson(pilotPath) : null
const previewUrl = 'https://www.scribd.com/document/1067004050/%E4%BA%BA%E6%95%99%E7%89%88-%E4%B8%89%E5%B9%B4%E7%BA%A7%E4%B8%8A%E5%86%8C-2025%E7%A7%8B%E7%89%88-%E8%AF%AD%E6%96%87%E7%94%B5%E5%AD%90%E8%AF%BE%E6%9C%AC'
const previewSourceId = 'cn-preview-2025'
const kinds = ['recognition_character', 'writing_character', 'textbook_word']
const chineseLexemes = inventory.lexemes.filter((item) => item.subject === 'chinese')
const chineseCourses = inventory.courses.filter((course) => course.subject === 'chinese')
const lessonPages = {
  1: 2, 2: 5, 3: 7, 4: 14, 5: 16, 6: 19, 7: 22, 8: 28, 9: 32,
  10: 36, 11: 46, 12: 49, 13: 52, 14: 60, 15: 62, 16: 70, 17: 73,
  18: 75, 19: 78, 20: 84, 21: 86, 22: 89, 23: 96, 24: 97, 25: 100, 26: 103,
}
const gardenPages = { 1: 11, 2: 25, 3: 43, 4: 55, 6: 81, 7: 93, 8: 107 }
const lessonReviewPages = {
  1: '2—4', 2: '5—6', 3: '7—8', 4: '14—15', 5: '16—18', 6: '19—21',
  7: '22—23', 8: '28—31', 9: '32—35', 10: '36—40', 11: '46—48',
  12: '49—51', 13: '52—53', 14: '60—61', 15: '62—64', 16: '70—72',
  17: '73—74', 18: '75—77', 19: '78—79', 20: '84—85', 21: '86—88',
  22: '89—90', 23: '96', 24: '97—99', 25: '100—102', 26: '103—104',
}
const gardenReviewPages = { 1: '11—12', 2: '25—26', 3: '43—44', 4: '55—56', 6: '81—82', 7: '93—94', 8: '107—108' }
const pilotLessons = pilot?.lessons ?? []
const pilotReadingMap = new Map(pilotLessons.flatMap((lesson) =>
  [...lesson.recognitionCharacters, ...lesson.writingCharacters].map((item) => [item.lexemeId, item])))
const permittedSupplements = new Set(['cn-04-writing_character-02', 'cn-04-writing_character-11'])
const missingTableLessons = {
  writing: [3, 7, 9, 10, 13, 19, 26],
  words: [3, 4, 7, 9, 10, 13, 19, 20, 23, 26],
}
const pilotMetadata = {
  'cn-01': {
    recitation: {
      status: 'not_specified_in_preview', scope: [], sourcePage: '4',
      note: '公开预览课后要求未指定背诵；不据此推断老师不会另行布置。',
    },
    dictation: {
      status: 'not_specified_in_preview', scope: [], sourcePage: '4',
      note: '公开预览课后要求未指定课文语句默写；字词听写属于另列基础练习。',
    },
  },
  'cn-04': {
    recitation: {
      status: 'preview_checked', scope: ['望洞庭', '山行', '夜书所见'], sourcePage: '15',
      note: '公开预览课后要求为三首古诗均需背诵；2026年纸本要求尚待复核。',
    },
    dictation: {
      status: 'preview_checked', scope: ['山行'], sourcePage: '15',
      note: '公开预览课后要求明确默写《山行》；另外两首不计为本课必默写。',
    },
  },
}

function sourceItem(item) {
  const supplement = !item.pinyin && permittedSupplements.has(item.id) ? pilotReadingMap.get(item.id) : null
  if (supplement) assert.equal(supplement.character, item.text, '补核读音必须与原汉字和ID对应')
  return {
    lexemeId: item.id, text: item.text, pinyin: item.pinyin?.trim() || supplement?.pinyin || null,
    readingVerified: item.readingVerified === true || Boolean(supplement?.pinyin),
    sourcePage: item.sourcePage, sourceId: previewSourceId,
    writingRequirement: item.writingRequirement ?? 'pending',
    ...(supplement ? { pinyinSupplemented: true, readingSourceId: supplement.sourceId, readingContext: supplement.context } : {}),
  }
}

function groupingFor(courseId) {
  const lesson = pilotLessons.find((item) => item.courseId === courseId)
  if (!lesson) return []
  const byCharacter = new Map()
  for (const item of [...lesson.recognitionCharacters, ...lesson.writingCharacters]) {
    let group = byCharacter.get(item.character)
    if (!group) {
      group = { character: item.character, pinyin: item.pinyin, context: item.context, lexemeIds: [], wordExamples: [] }
      byCharacter.set(item.character, group)
    }
    group.lexemeIds.push(item.lexemeId)
    for (const example of item.wordExamples) {
      assert.equal(example.sourceKind, 'editorial_extension', '组词示例必须标为原创拓展')
      assert(example.text.includes(item.character), '组词示例必须包含目标汉字')
      if (!group.wordExamples.some((existing) => existing.text === example.text && existing.pinyin === example.pinyin)) {
        group.wordExamples.push({ ...example, sourceId: 'editorial', status: 'editorial_reviewed' })
      }
    }
  }
  return [...byCharacter.values()]
}

function count(items) {
  const pinyinReady = items.filter((item) => item.pinyin && item.readingVerified).length
  return { total: items.length, pinyinReady, pinyinPending: items.length - pinyinReady }
}

const pendingRequirement = (label) => ({
  status: 'pending', scope: [], sourcePage: null,
  note: `未核对本课/园地${label}要求；空清单表示待核，不表示无要求。`,
})

const courses = chineseCourses.map((course) => {
  const byKind = kinds.map((kind) => chineseLexemes.filter((item) => item.courseId === course.id && item.kind === kind).map(sourceItem))
  const [recognition, writing, words] = byKind
  const metadata = pilotMetadata[course.id]
  return {
    id: course.id, title: course.title, kind: course.kind,
    unitNumber: course.unitNumber, lessonNumber: course.lessonNumber ?? null,
    startPage: course.lessonNumber ? lessonPages[course.lessonNumber] : gardenPages[course.unitNumber],
    paperReviewPageRange: course.lessonNumber ? lessonReviewPages[course.lessonNumber] : gardenReviewPages[course.unitNumber],
    recognition, writing, words,
    counts: { recognition: count(recognition), writing: count(writing), words: count(words) },
    groupingStatus: metadata ? 'pilot' : 'pending',
    grouping: groupingFor(course.id),
    recitation: metadata?.recitation ?? pendingRequirement('背诵'),
    dictation: metadata?.dictation ?? pendingRequirement('默写'),
    requirementSourceId: metadata ? previewSourceId : null,
    paperVerified: false, pilotAvailable: Boolean(metadata),
  }
})

const summary = {
  lessons: courses.filter((course) => course.kind === 'lesson').length,
  gardensInDirectory: courses.filter((course) => course.kind === 'garden').length,
  gardensWithListedItems: courses.filter((course) => course.kind === 'garden' && course.counts.recognition.total > 0).length,
  recognition: count(chineseLexemes.filter((item) => item.kind === kinds[0]).map(sourceItem)),
  writing: count(chineseLexemes.filter((item) => item.kind === kinds[1]).map(sourceItem)),
  words: count(chineseLexemes.filter((item) => item.kind === kinds[2]).map(sourceItem)),
  requirementsPreviewChecked: Object.keys(pilotMetadata).length,
  allPaperVerified: false,
  inventoryPinyinReady: chineseLexemes.filter((item) => item.pinyin && item.readingVerified).length,
  pilotSupplementedReadings: courses.reduce((total, course) => total + [...course.recognition, ...course.writing, ...course.words].filter((item) => item.pinyinSupplemented).length, 0),
  groupingCharacters: courses.reduce((total, course) => total + course.grouping.length, 0),
}
summary.totalRecords = summary.recognition.total + summary.writing.total + summary.words.total
summary.pinyinReady = summary.recognition.pinyinReady + summary.writing.pinyinReady + summary.words.pinyinReady
summary.pinyinPending = summary.totalRecords - summary.pinyinReady

assert.equal(summary.lessons, 26, '应保留新版目录26课')
assert.equal(summary.recognition.total, 276, '识字展示项应为276条，不等同生字总数')
assert.equal(summary.writing.total, 250, '写字表应为250条')
assert.equal(summary.words.total, 250, '词语表应为250条')
assert.equal(summary.gardensWithListedItems, 4, '三表园地应归属3/4/7/8')
assert.equal(new Set(chineseLexemes.map((item) => item.id)).size, chineseLexemes.length, '记录ID须唯一')
assert(chineseLexemes.every((item) => courses.some((course) => course.id === item.courseId)), '所有条目都须归属课程')

const plan = {
  schemaVersion: 1,
  updatedOn: '2026-10-04',
  edition: {
    publisher: '人民教育出版社', title: '义务教育教科书 语文 三年级 上册',
    isbn: '978-7-107-39754-7', firstEdition: '2025年6月第1版',
    userPrint: '2026年7月第2次印刷', paperVerified: false,
  },
  sourceBoundary: {
    directory: '用户提供的26课目录及版权页照片；课文起始页仅用于定位。',
    wordTables: '同26课目录公开教材预览转录；识字表p109—111、写字表p112—113、词语表p114—116。',
    sourceId: previewSourceId,
    note: '公开预览为第三方托管，印次未明确。所有项目仍待用户2026纸本最终复核；原清单的拼音审核字段不等同纸本逐项核准。',
  },
  sources: [
    { id: previewSourceId, label: '同26课目录的2025新版教材公开预览', url: previewUrl, note: '第三方托管，公开预览印次未明；用户2026纸本待核。' },
    { id: 'cn-user-paper-directory', label: '用户纸本目录及版权页照片', url: null, note: '用户2026年第2次印刷；已见目录和版权页，书后三表与大部分正文待核。' },
    { id: 'cn-official-catalog', label: '人教社电子教材目录', url: 'https://jc.pep.com.cn/', note: '仅官方目录已知；项目未成功获取相关内页。' },
    ...(pilot?.sources ?? []).map((source) => ({ id: source.id, label: source.title, url: source.url ?? null, note: source.note })),
  ],
  summary, courses,
}

const md = []
const add = (...lines) => md.push(...lines)
const safe = (text) => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ')
const displayPinyin = (item) => item.pinyin ? safe(item.pinyin) : '**待核**'
const readingState = (item) => item.pinyinSupplemented ? `两课样板补核；${item.readingContext}；纸本待核` : item.pinyin && item.readingVerified ? '项目本课读音已审核；纸本待核' : item.pinyin ? '已有拼音，读音待核' : '拼音/本课读音待核'
const displayCount = (value) => `${value.total} / ${value.pinyinReady}`
const requirementDisplay = (requirement) => requirement.status === 'pending' ? '待核' : requirement.scope.length ? requirement.scope.map((title) => `《${title}》`).join('、') : '预览课后未指定'

add('# 三年级上册语文逐课基础训练清单', '',
  '更新日期：2026-10-04。用于字音、字形、组词、独立书写和背诵默写的逐课核对；不把本清单称为全部考试范围，也不以点击选择代替真实书写。', '',
  '本文件与 `src/data/chineseSemesterPlan.json` 由 `node scripts/export-chinese-plan.mjs` 同时生成；字词依据为 `src/data/inventory.json`，对应转录底稿为 `research/chinese/wordgame_chinese_inventory.md`。修改字词请修正审核数据后重新导出，不直接改生成结果。', '',
  '## 1. 26课总览', '',
  '数字写为“条目总数 / 已有审核拼音数”。同一个字在认读表和写字表分别计数；认读展示项包括多音字再次出现的项目。**背诵／默写的“待核”不是“没有要求”。**', '',
  '| 课次 | 课名 | 单元 | 课文起始页 | 认读展示 | 会写字 | 教材词语 | 组词准备 | 背诵范围 | 课文默写范围 |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for (const course of courses.filter((item) => item.kind === 'lesson')) {
  add(`| ${course.lessonNumber} | ${safe(course.title)} | ${course.unitNumber} | ${course.startPage} | ${displayCount(course.counts.recognition)} | ${displayCount(course.counts.writing)} | ${displayCount(course.counts.words)} | ${course.pilotAvailable ? '两课样板' : '待建逐字组词库'} | ${requirementDisplay(course.recitation)} | ${requirementDisplay(course.dictation)} |`)
}
add('', '## 2. 总量、来源与待核边界', '',
  '| 分类 | 条目总数 | 已有审核拼音 | 拼音／本课读音待核 | 来源页 |',
  '| --- | --- | --- | --- | --- |',
  `| 识字表全部展示项 | ${summary.recognition.total} | ${summary.recognition.pinyinReady} | ${summary.recognition.pinyinPending} | 109—111 |`,
  `| 写字表 | ${summary.writing.total} | ${summary.writing.pinyinReady} | ${summary.writing.pinyinPending} | 112—113 |`,
  `| 词语表 | ${summary.words.total} | ${summary.words.pinyinReady} | ${summary.words.pinyinPending} | 114—116 |`,
  `| 合计 | ${summary.totalRecords} | ${summary.pinyinReady} | ${summary.pinyinPending} | 三类记录分别保留 |`, '',
  '- 教材：教育部组织编写、人民教育出版社《语文 三年级 上册》，2025年6月第1版，用户纸本为2026年7月第2次印刷，ISBN 978-7-107-39754-7。用户照片已确认版权页、26课目录及起始页，尚缺纸本书后完整三表与大部分课后要求。',
  `- 字词原表来自[同26课目录的公开教材预览](${previewUrl})。公开预览由第三方托管，印次未明；与用户目录及三表起始页一致，仍须复核2026纸本p109—116。不能称为“2026纸本已逐页核验”。`,
  '- [人教社电子教材目录](https://jc.pep.com.cn/)的相关内页目前未在项目中成功获取，不把官方目录链接冒充已经读取的官方教材原文。',
  '- 识字表276条是展示记录；教材注明部分蓝色字为以前学过、此次学习另一读音的字。原预览纯文本没有保留蓝色标记，不能把276条宣传为276个本学期新生字，也不按字形去重删除多音字。',
  '- 拼音为项目逐词/逐字编辑审核结果，表示数据库当前可用于本课练习的读音。缺失项不从输入法或词语拼音拆分自动补齐；“已审核”也不等于2026纸本复核。',
  `- 原inventory已有${summary.inventoryPinyinReady}条审核拼音。本次只从两课样板补核第4课写字“相（xiāng）、落（luò）”两项，实际补核${summary.pilotSupplementedReadings}项；原inventory保持不变，导出清单保留补核来源与“两相和／篱落”等本课语境。`,
  '- 教材词语表不等于每个词都已明确列为本课必默写。原数据 `writingRequirement=pending` 的词条可做纸上自查练习，是否计为教材／老师指定必写目标须另核。',
  '- 第1课课后要求p4与第4课课后要求p15已由本次样板内容审核核读同目录预览。第4课三首均需背诵，明确默写《山行》；第1课预览未指定课文背诵或默写。其余24课和各园地的背诵／默写要求保留待核。', '',
  '## 3. 实施方式与记录规则', '',
  '先交付第1课与第4课两课样板，确认难度和操作负担后再扩展其余课。网站沿用短轮次，一屏一道题；普通字词每轮4—6项，不额外插入词义情景、长动画或多层确认页面。', '',
  '| 能力 | 出题与核对 | 可以留下的证据 | 不能据此声称的能力 |',
  '| --- | --- | --- | --- |',
  '| 字音／拼音 | 看汉字或本课词语选拼音，声调、易错读音和多音字按语境区分 | 独立字音选择；提示使用另记 | 会写、背默、独立口头认读 |',
  '| 字形辨析 | 在明确词语／短句中找错别字、选择形近字；课后给出字形和组词对照 | 独立字形判断 | 不看答案独立写对 |',
  '| 指定字组词 | 以目标汉字组词，给多项已审核可接受答案；教材词与原创拓展词分开标记 | 组词识别或自查组词，按任务形式记录 | 任意中文输入都能准确自动评分 |',
  '| 真实书写 | 看拼音或听词后在纸上写；一轮结束集中揭晓答案，标记具体写错项 | “纸上完成＋本人自查”或“家长／老师核对”分别记 | 输入法选字、选择题答对即会写 |',
  '| 背诵 | 对照教材确认范围；遮盖后背诵并自查，漏字、错序对应记录 | 背诵自查／成人确认，不与点击接句混记 | 程序已经自动判定口头背诵正确 |',
  '| 默写 | 按确认的教材／老师范围，隐藏原句在纸上写；完成后集中核对 | 默写自查／成人确认，记录具体错字与漏字 | 看着原句抄写即独立默写 |', '',
  '复习应回到具体错音、错字、错词或错句；单次正确不等于稳定掌握，需不同日期的独立复测。教师演示不写入孩子成绩。字词、组词、背诵与默写的记录互不覆盖。', '',
  '## 4. 逐课详细清单', '',
  '以下完整保留现有三表条目；拼音栏出现“待核”时，该项应留在学习清单，暂不制作会自动判错的拼音／听写题。每课的组词准备和背默来源分别说明。')

function addItems(title, items, sourcePage, emptyText) {
  add('', `### ${title}`, '')
  if (!items.length) {
    add(emptyText)
    return
  }
  add(`来源：公开预览印刷页p${sourcePage}，用户2026纸本待复核。`, '',
    '| 汉字／词语 | 现有本课拼音 | 读音准备状态 |',
    '| --- | --- | --- |')
  for (const item of items) add(`| ${safe(item.text)} | ${displayPinyin(item)} | ${readingState(item)} |`)
}

function addGrouping(course) {
  add('', '### 组词准备', '')
  if (course.grouping.length) {
    add(`两课样板已准备${course.grouping.length}个不同汉字的组词示例（包括认读与写字目标）。词例及其拼音来自独立审核的 \`src/data/chinesePilot.json\`，全部明确标为原创拓展；即使与课本词语表相同，也不新增“教材指定词语”要求。`, '',
      '| 目标汉字 | 本课读音／语境 | 原创拓展组词（拼音） | 来源与要求 |',
      '| --- | --- | --- | --- |')
    for (const group of course.grouping) {
      add(`| ${safe(group.character)} | ${safe(group.pinyin)}；${safe(group.context)} | ${group.wordExamples.map((example) => `${safe(example.text)}（${safe(example.pinyin)}）`).join('、')} | 项目原创组词示例；不额外要求全部必默写 |`)
    }
    return
  }
  add('尚未建立本课专用组词库。下面仅列本课写字表目标与原词语表中包含该字的候选词，便于补库时核对；这些匹配不是已经审核的组词题，也不证明每个汉字只有这一种组词。')
  if (!course.writing.length) {
    add('本课没有独立写字表条目。可在教师确认后为认读字补充组词，但应标为拓展，不擅自把所有认读字升级为本课必写目标。')
    return
  }
  add('', '| 写字目标 | 本课原词语表中的候选词 | 专用组词练习状态 |', '| --- | --- | --- |')
  for (const item of course.writing) {
    const candidates = course.words.filter((word) => word.text.includes(item.text)).map((word) => word.text)
    add(`| ${safe(item.text)} | ${candidates.length ? candidates.map(safe).join('、') : '未找到；需补审核词例'} | 待审核与建库 |`)
  }
}

for (const course of courses.filter((item) => item.kind === 'lesson')) {
  add('', `## 第${course.lessonNumber}课：${course.title}`, '',
    `课程ID：\`${course.id}\`；第${course.unitNumber}单元；课文从印刷页p${course.startPage}开始。当前三表：认读${course.counts.recognition.total}项、写字${course.counts.writing.total}项、词语${course.counts.words.total}项。`, '',
    `本课已有审核拼音${course.counts.recognition.pinyinReady + course.counts.writing.pinyinReady + course.counts.words.pinyinReady}项，待核${course.counts.recognition.pinyinPending + course.counts.writing.pinyinPending + course.counts.words.pinyinPending}项；组词与背默要求分别列于下方。`)
  addItems('会认字与拼音（识字展示项）', course.recognition, '109—111', '现有识字展示表无此课条目，须核对原页；不自行补造生字要求。')
  addItems('会写字与拼音（写字表）', course.writing, '112—113', missingTableLessons.writing.includes(course.lessonNumber)
    ? '同目录公开写字表未为本课列出独立条目；不将认读字自动改为本课必写字。老师补充写字任务另列。'
    : '现有写字表无此课条目，须核对原页；不自行推断本课无书写要求。')
  addItems('教材词语与拼音（词语表）', course.words, '114—116', missingTableLessons.words.includes(course.lessonNumber)
    ? '同目录公开词语表未为本课列出独立词条。仍可练习认读／写字目标；新增组词须标原创拓展。'
    : '现有词语表无此课条目，须核对原页；不自行补造教材词语。')
  addGrouping(course)
  add('', '### 背诵与课文默写', '', '| 项目 | 范围 | 来源与核对状态 |', '| --- | --- | --- |',
    `| 背诵 | ${requirementDisplay(course.recitation)} | ${course.recitation.note}${course.recitation.sourcePage ? `依据公开预览p${course.recitation.sourcePage}；2026纸本待核。` : ''} |`,
    `| 必默写 | ${requirementDisplay(course.dictation)} | ${course.dictation.note}${course.dictation.sourcePage ? `依据公开预览p${course.dictation.sourcePage}；2026纸本待核。` : ''} |`,
    '| 老师补充 | 尚未提供 | 与教材要求分别存储；不能默认为必背／必默写。 |')
  if (course.requirementSourceId) add('', `本课背默要求核对来源：[同目录教材预览p${course.recitation.sourcePage}](${previewUrl})。`)
}

add('', '## 5. 语文园地逐项清单', '',
  '目录有语文园地1、2、3、4、6、7、8。第五单元是习作单元，目录未列“语文园地5”，不为了凑八处而添加。三表只有园地3、4、7、8的实际字词；园地1、2、6正文学习要求仍待核。', '',
  '| 园地 | 起始页 | 认读展示总数 / 已有审核拼音 | 写字总数 / 已有审核拼音 | 词语总数 / 已有审核拼音 | 正文背默与其他要求 |',
  '| --- | --- | --- | --- | --- | --- |')
for (const course of courses.filter((item) => item.kind === 'garden')) {
  add(`| ${course.unitNumber} | ${course.startPage} | ${displayCount(course.counts.recognition)} | ${displayCount(course.counts.writing)} | ${displayCount(course.counts.words)} | 待核正文；不据三表空项推断无要求 |`)
}
for (const course of courses.filter((item) => item.kind === 'garden')) {
  add('', `## ${course.title}`, '', `课程ID：\`${course.id}\`；目录起始页p${course.startPage}。`)
  if (!course.recognition.length && !course.writing.length && !course.words.length) {
    add('', '书后现有三表未列此园地条目，正文尚未提供。识字活动、词句段运用、日积月累、背诵／默写要求均待核；页面应显示待核内容，不能制作空关冒充完成。')
    continue
  }
  addItems('会认字与拼音', course.recognition, '109—111', '三表未列条目。')
  addItems('会写字与拼音', course.writing, '112—113', '三表未列条目。')
  addItems('教材词语与拼音', course.words, '114—116', '三表未列条目。')
  addGrouping(course)
  add('', '背诵、默写及日积月累：**待核正文**。上面的字词表不能替代整个园地的教学要求。')
}

add('', '## 6. 下一批核对资料与全册扩展顺序', '',
  '先复核书后p109—116的完整识字表、写字表、词语表，再核26课课后要求及七个园地正文。用于两课样板的第1课p2—4、第4课p14—15也应与2026纸本核对，优先核第4课“相、落”的本课读音、诗句字形和课后要求。', '',
  '| 纸本资料 | 精确页码或目录定位范围 | 需要核对的内容 |',
  '| --- | --- | --- |',
  '| 识字表 | p109—111 | 汉字、逐字读音、蓝色复习多音字身份 |',
  '| 写字表 | p112—113 | 每课会写字、字形、读音及实际归属 |',
  '| 词语表 | p114—116 | 每课词条与拼音，特别核第18课“起来” |')
for (const course of courses) {
  add(`| ${course.kind === 'lesson' ? `第${course.lessonNumber}课` : course.title} | p${course.paperReviewPageRange} | ${course.kind === 'lesson' ? '在此范围内拍课后要求；两课样板另核原文与读音' : '完整园地正文，含日积月累及明确背默要求'} |`)
}
add('', '课文和园地定位范围由已提供目录的相邻课／栏目起始页计算，用来找到课后要求；尚未逐页验证未提供的正文，不声称课后要求一定在每个范围的最后一页。', '',
  '全册扩展跟随老师教学进度：先把当前单元的字音、形近字、逐字组词和真实听写做准，再加入已核范围的背默。需要提前查看时可浏览完整26课清单；不给未来所有课一次布置重复训练。', '',
  '| 扩展批次 | 课程范围 | 内容验收 |', '| --- | --- | --- |',
  '| 两课样板 | 第1课、第4课 | 完整字音／组词／纸上核对流程；三首背诵与仅《山行》必默写；其他诗句为可选练习 |',
  '| 第1、2单元 | 第2、3、5、6、7课及园地1、2 | 补缺拼音，逐课建组词库；核课后背默与园地正文 |',
  '| 第3、4单元 | 第8—13课及园地3、4 | 特别核多音字语境，认读与必写分开；园地词表归属不混入课文 |',
  '| 第5、6单元 | 第14—19课及园地6 | 核“起来”等疑点，建立字形辨析与字词听写；阅读和习作另有目标 |',
  '| 第7、8单元 | 第20—26课及园地7、8 | 核古诗、文言文和园地日积月累的真实背默要求，不套旧版清单 |', '',
  '内容验收必须确认：每课字词没有遗漏／混入旧版，读音与本课语境对应，所有组词可接受答案经过审核，教材与拓展要求分别标记，选择正确与独立书写记录分开。完成这些内容后再考虑手写识别、语音自动评测或额外媒体能力。', '',
  '## 7. 生成与一致性校验', '',
  '运行 `node scripts/export-chinese-plan.mjs` 生成JSON与本文；运行 `node scripts/export-chinese-plan.mjs --check` 检查两者与当前原始清单一致。脚本仅写这两个输出文件，不修改原 inventory、英语内容或应用界面。', '',
  '生成时校验26课、276条认读展示、250条写字、250条词语、四个有实际字词的园地、条目ID唯一和课程归属。拼音就绪数量从真实字段计算；后续补核拼音后重新生成即可更新，不以固定缺项数锁死后续进展。', '')

const outputs = {
  'src/data/chineseSemesterPlan.json': `${JSON.stringify(plan, null, 2)}\n`,
  'docs/CHINESE_SEMESTER_PLAN.md': `${md.join('\n').trimEnd()}\n`,
}
for (const [path, text] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) {
    assert.equal(readFileSync(file(path), 'utf8'), text, `${path} 与来源不一致；请重新生成`)
  } else {
    writeFileSync(file(path), text, 'utf8')
  }
}
console.log(JSON.stringify({ checked: process.argv.includes('--check'), ...summary, pilotDataPresent: Boolean(pilot), outputs: Object.keys(outputs).map((path) => fileURLToPath(file(path))) }, null, 2))
