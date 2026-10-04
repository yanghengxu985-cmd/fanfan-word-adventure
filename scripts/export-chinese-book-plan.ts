import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { studioSources, studioUnits, lessonDesigns } from '../src/data/chineseBookStudio';
import { chineseBookCompanions } from '../src/data/chineseBookCompanions';

const root = new URL('../', import.meta.url);
const plan = JSON.parse(readFileSync(new URL('src/data/chineseSemesterPlan.json', root), 'utf8'));
const kinds = { writing: '习作', speaking: '口语交际', garden: '语文园地', reading: '快乐读书吧', example: '习作例文', review: '原创期末复习' };
type Requirement = { status: string; scope: string[] };
function requirementText(item: Requirement, kind: 'recitation' | 'dictation') {
  if (item.status === 'preview_checked') return `${item.scope.map(title => `《${title}》`).join('、')}（同目录公开预览已核，2026纸本待复核）`;
  if (item.status === 'not_specified_in_preview') return `同目录预览未指定${kind === 'recitation' ? '课文背诵' : '语句默写'}；另按老师布置，不代表没有字词练习。`;
  return '范围待核对课后题；待核不等于没有要求，不套用旧版清单。';
}
const lines = [
  '# 三年级上册语文：全册学习与课件安排', '',
  '沿用已认可的《山行》案例：先理解，再练字词；背诵与默写只安排核实的教材要求。页面直接选择内容，已经会的部分跳过，不用强制依次闯关。', '',
  '教材：人教统编三年级上册，2025年6月第1版；凡凡纸本为2026年7月第2次印刷，ISBN 978-7-107-39754-7。目录和页码已按家长照片确认。', '',
  '范围：8单元、26课、8篇习作、4次口语交际、7个园地、快乐读书吧、2篇习作例文，另加原创期末复习。第五单元没有语文园地。', '',
  '当前完成状态：26课互动课件及23项配套学习页已制作。每课有原创情境插图、4个讲解步骤、课内字词和理解练习；两课古诗展开为6首诗景、朗读和遮字背诵。写字以纸笔检查为准。现代课文须配合手边教材阅读，2026纸本正文、三表与大部分背默要求仍待逐项复核。', '',
  '在线安排：https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-book', '',
  '《山行》体验：https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/shanxing', '',
  '## 使用与制作原则', '',
  '- 每课分清：会认字、会写字、课内词语、组词练习、理解与表达、教材明确的背默内容。不会用选择题正确推断能独立书写。',
  '- 拼音按课内语境逐项核对。多音字、单字本音、词中轻声分别处理；待核读音不用于自动判错或听写。字词表取自同目录公开预览，凡凡2026纸本书后三表仍待复核。',
  '- 理解工具随课文调整：古诗用诗景；故事用事件和言行；预测先猜再读后文；观察类用细节和变化；写景类用段落关键句；文言用断句、注释和复述。',
  '- 同目录预览仅第1、4课课后要求已核：第1课未指定课文背默；第4课背诵三首，仅明确默写《山行》。其他24课及7个园地的背默范围待核。空清单不能解释为没有要求。',
  '- 3、7、9、10、13、19、26为略读课。按认读和理解安排，书后未列本课会写字、词语，不人为追加必写或必背。',
  '- 《铺满金色巴掌的水泥道》小练笔选做；《读不完的大书》不设已取消的必做仿写。第五单元先真实观察、尝试写，遇到困难再参考后置例文。',
  '- 所有画面、互动、检查问题和组词示例为原创辅导设计，不宣称是学校必考题；园地日积月累、课后指定段落须先核对新版原页。',
  '- iPad主要教学画面、选择与操作同屏；每课可直接切换理解、字词及按需开放的背默。教师可展开讲解与打印练习，学生不需反复点击“下一步”。',
  '- 网上网课、课件与范写保留原站入口，不搬运；国家平台选择“新教材”并按本课标题核对。朗读、图片和动画均标明来源或原创/合成属性。', '',
  '## 跟随学校进度的安排', '',
  '不因已经开学一个月而从第一课重做。先看正在学的单元：理解一处重点，检查少量字词；已学单元只查薄弱项。一个单元结束时，做一次小份字词、阅读方法和已核背默检查，错误定位后回练。', '',
  '使用顺序跟随学校进度，26课与配套模块都可独立打开。第一单元作为回查补齐，不要求孩子重复已掌握内容。预测课在读到后文以前不提前展示理解题中的角色与结局；待核字音不进入拼音纸写检查。', '',
  '验收以实际证据为准：认读能换语境；会写要查看纸稿；理解能回到原文说依据；背诵脱离全文；默写独立写后核对。本人自查、成人核对及隔日复查分开，不用一次正确宣称长期掌握。', '',
];

for (const unit of studioUnits) {
  lines.push(`## 第${unit.number}单元 · ${unit.title}`, '', `阅读目标：${unit.readingGoal}`, '', `表达目标：${unit.writingGoal}`, '');
  for (const course of plan.courses.filter((item: { kind: string; unitNumber: number }) => item.kind === 'lesson' && item.unitNumber === unit.number)) {
    const design = lessonDesigns.find(item => item.courseId === course.id)!;
    const skim = [3, 7, 9, 10, 13, 19, 26].includes(course.lessonNumber);
    lines.push(`### ${course.lessonNumber}. ${course.title}${skim ? '（略读）' : ''} · 第${course.startPage}页`, '',
      `课件：https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/${course.id}`, '',
      `- 学习重点：${design.focus}`, `- 课件形式：${design.form}`, `- 练习安排：${design.practice}`, `- 检查方法：${design.check}`, `- 注意：${design.note}`, '',
      `会认字（${course.recognition.length}）：${course.recognition.map((item: { text: string }) => item.text).join('、') || '本课清单未列项目'}。`, '',
      `会写字（${course.writing.length}）：${course.writing.map((item: { text: string }) => item.text).join('、') || '书后未列本课会写字，不追加必写'}。`, '',
      `课内词语（${course.words.length}）：${course.words.map((item: { text: string }) => item.text).join('、') || '书后词语表未另列本课词语'}。`, '',
      `背诵：${requirementText(course.recitation, 'recitation')}`, '', `语句默写：${requirementText(course.dictation, 'dictation')}`, '');
  }
  lines.push('### 配套学习', '');
  for (const item of chineseBookCompanions.filter(item => item.unit === unit.number)) {
    lines.push(`#### ${kinds[item.kind]} · ${item.title}${item.page ? `（第${item.page}页）` : ''}`, '',
      `课件：https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-companion/${item.id}`, '',
      `- 目标：${item.goal}`, `- 形式：${item.form}`, `- 检查：${item.check}`, `- 依据与边界：${item.note}`, '');
    if (item.kind === 'garden') {
      const garden = plan.courses.find((course: { kind: string; unitNumber: number }) => course.kind === 'garden' && course.unitNumber === unit.number);
      lines.push(`会认字（${garden.recognition.length}）：${garden.recognition.map((entry: { text: string }) => entry.text).join('、') || '本园地条目待补充核对，不代表没有内容'}。`, '',
        `会写字（${garden.writing.length}）：${garden.writing.map((entry: { text: string }) => entry.text).join('、') || '本园地条目待补充核对，不代表没有内容'}。`, '',
        `课内词语（${garden.words.length}）：${garden.words.map((entry: { text: string }) => entry.text).join('、') || '本园地条目待补充核对，不代表没有内容'}。`, '',
        `背诵：${requirementText(garden.recitation, 'recitation')}`, '', `语句默写：${requirementText(garden.dictation, 'dictation')}`, '');
    }
  }
}
lines.push('## 资料来源与待补内容', '');
for (const source of studioSources) lines.push(`- [${source.title}](${source.url})：${source.note}`);
lines.push('', '具体字词来源、拼音审核状态和逐页核对范围保留在现有《全学期清单》：https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-plan 。本文件列出字词用于逐课安排，不表示所有拼音、纸本正文和背默要求已经审核完成。', '',
  '后续教材复核：对照2026纸本正文、三表和课后要求逐项核对，补充园地1、2、6的具体字词与日积月累；复核后才把自选背默改为教材要求。当前原创课件已可使用，但不代替完整教材正文或经教师审定的考试清单。', '');
const content = lines.join('\n');
for (const path of ['docs/CHINESE_BOOK_STUDIO_PLAN.md', 'public/plans/chinese-book-plan.md']) {
  const url = new URL(path, root);
  if (process.argv.includes('--check')) {
    if (readFileSync(url, 'utf8') !== content) throw new Error(`${path} 与逐课安排不同步，请运行 npm exec tsx scripts/export-chinese-book-plan.ts`);
  } else {
    mkdirSync(new URL('./', url), { recursive: true });
    writeFileSync(url, content, 'utf8');
  }
}
console.log(process.argv.includes('--check') ? '全册安排下载文件与源数据一致。' : '已导出全册安排及网页下载文件。');
