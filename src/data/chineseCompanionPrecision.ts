import { chineseBookCompanions } from './chineseBookCompanions';
import type { CompanionTask } from './chineseCompanionTasks';

export type WorkshopKind = 'identity' | 'timeline' | 'story' | 'stage' | 'observation' | 'map' | 'reason' | 'memory' | 'conversation' | 'reading' | 'evidence' | 'angles' | 'expression' | 'context' | 'prediction' | 'roles' | 'mainidea' | 'sound' | 'classify' | 'review';
export type CompanionWorkshop = { kind: WorkshopKind; title: string; instruction: string; labels: string[]; note: string; movable?: boolean };
export const companionWorkshops: Record<string, CompanionWorkshop> = {
  'book-u1-speaking': { kind: 'conversation', title: '把暑假的一幕讲给我听', instruction: '点选讲述者或听众，直接开始交流。自己的三张画面卡可以换顺序。', labels: ['当时在哪里', '做了什么', '后来怎样'], movable: true, note: '讲的是实际经历；听众问一个没听清的地方。' },
  'book-u1-writing': { kind: 'identity', title: '藏住名字的线索墙', instruction: '写下真实特点，再点一张线索放大，请熟悉这个人的家人猜一猜。', labels: ['线索一', '线索二', '读者的依据'], note: '不用填写名字。猜不出时只改一条笼统的线索。' },
  'book-u1-garden': { kind: 'expression', title: '一句话里的新鲜感', instruction: '比较两种写法，点亮让画面不同的词。', labels: ['平常说法', '有新鲜感的说法'], note: '原创方法练习；真实园地栏目和日积月累仍待纸本核对。' },
  'book-u2-writing': { kind: 'timeline', title: '今天的日记页', instruction: '记下日期和今天的一件事。点卡片整理自己的见闻，不生成可照抄日记。', labels: ['日期提醒', '真实见闻', '当时感受'], note: '日期等格式先看纸本示例，不强制额外天气栏。' },
  'book-u2-garden': { kind: 'context', title: '把词放回上下文', instruction: '直接切换理解方法；圈定一条能说明意思的线索。', labels: ['上下文', '生活经验', '工具书'], note: '方法可以不同，最后要放回句子检查是否合适。园地原题另待核。' },
  'book-u3-speaking': { kind: 'conversation', title: '名字的来历与还想问的事', instruction: '选角色直接说。把家人告诉的事实与还不知道的问题分开。', labels: ['已问到的事实', '了解到的含义', '还想问'], note: '不知道就保留为问题；不用公开真实姓名。' },
  'book-u3-writing': { kind: 'story', title: '接得上前文的故事线', instruction: '先从自己的纸本记一条线索，再安排后续。移动卡片比较事情是否接得上。', labels: ['前文线索', '后续行动', '回应前文的结果'], movable: true, note: '纸本给定开头仍待原页核对；这里只整理自己的后续，不提供教材结局。' },
  'book-u3-garden': { kind: 'prediction', title: '门口的画：保留不同猜想', instruction: '点选开头线索，也可以随时展开后文，再比较自己的猜想。', labels: ['已读信息', '我的猜想', '新信息'], note: '原创故事。猜中与否不判分，看猜想是否联系已读线索。' },
  'book-u4-writing': { kind: 'stage', title: '自己的童话小舞台', instruction: '从纸本素材确定角色与地点，整理困难、行动和变化；点击卡片展示这一幕。', labels: ['角色与地点', '困难和行动', '结尾变化'], movable: true, note: '没有默认成文或固定道理。指定素材须看自己的教材。' },
  'book-u4-garden': { kind: 'roles', title: '想象要连得上行动', instruction: '先选角色，再选它的行动，看看两件文具怎样合作。', labels: ['铅笔', '橡皮', '行动'], note: '原创童话示意，与园地真实栏目分开。' },
  'book-u4-reading': { kind: 'reading', title: '我读过的角色与变化', instruction: '先记实际读过的书名和情节。点卡片说清谁做了什么，再留下一个问题。', labels: ['实际读过的故事', '角色与经历', '我的疑问'], note: '推荐书目先看纸本或家里现有书；不设摘抄数量和阅读时限。' },
  'book-u5-writing': { kind: 'observation', title: '观察记录：看到与猜到', instruction: '写一条自己的发现，选择“亲眼看到”或“还在猜想”，把记录放入相应栏。', labels: ['观察对象', '第一条发现', '第二条发现'], note: '两条发现分别归类，不把原因猜想写成观察事实。先观察，再自愿看例文。' },
  'book-u5-example-dog': { kind: 'evidence', title: '从具体动作看出特点', instruction: '把纸本的一处动作与自己的评价连起来，再换成自己见过的动物。', labels: ['纸本动作', '我的理解', '自己的观察'], note: '屏幕没有例文全文；方法可以借鉴，细节须真实。' },
  'book-u5-example-bayberry': { kind: 'angles', title: '换一个角度观察水果', instruction: '切换颜色、形状、味道，分别说出实际观察的依据；味道只写真正尝过的。', labels: ['纸本的观察角度', '自己的水果'], note: '原文与自己的观察分开，不照搬杨梅的特点到另一种水果。' },
  'book-u6-writing': { kind: 'map', title: '沿自己的路线看美景', instruction: '为自己的观察卡排顺序，点击一站，用具体景物解释美在哪里。', labels: ['亲眼见过的地方', '几处景物', '最想展开的细节'], movable: true, note: '卡片是观察路线示意，不是课文地理地图。无需上传照片。' },
  'book-u6-garden': { kind: 'mainidea', title: '概括要由细节支持', instruction: '选一张细节卡放入主意卡，说明它怎样支持这一段。', labels: ['段落主意', '相关细节'], note: '原创新段落用来迁移方法；真实园地原题与积累待核。' },
  'book-u7-speaking': { kind: 'conversation', title: '把事实和看法分清楚', instruction: '讲述者说事实与看法，听众可追问理由。直接切换角色，不用轮次按钮。', labels: ['实际发生的事', '我的看法', '依据'], note: '不同看法可并存；支持理由必须来自事情本身。' },
  'book-u7-writing': { kind: 'reason', title: '让想法连到真实现象', instruction: '把亲眼发现与理由联系起来，可以再添一个改进想法。点卡片检查是否相关。', labels: ['真实现象', '为什么在意', '选做：可以尝试的想法'], note: '建议栏可留空；这是可选整理工具，不要求固定三段作文。' },
  'book-u7-garden': { kind: 'sound', title: '让声音进入描写', instruction: '比较同一处竹林的不同说法，点亮声音词，说明带来了怎样的感受。', labels: ['声音', '联想', '感受'], note: '原创表达比较，音效不能作为课文理解答案。' },
  'book-u8-speaking': { kind: 'conversation', title: '把卡住的地方问清楚', instruction: '双方直接选角色。说明困惑、听取解释，再用自己的话确认，不背统一台词。', labels: ['具体困惑', '试过的办法', '听后的理解'], note: '请教真实问题；不自动评分说话或判断已经理解。' },
  'book-u8-writing': { kind: 'memory', title: '那次经历的关键一幕', instruction: '排清开始、关键一幕和结果。点选最难忘的一幕，留出更多细节。', labels: ['事情怎样开始', '难忘的一幕', '结果与感受'], movable: true, note: '经历真实；重点展开是表达选择，不要求编造更精彩的事件。' },
  'book-u8-garden': { kind: 'classify', title: '按用途整理交流会清单', instruction: '先选物品，再点用途栏。分类依据是实际用途，也可以说明不同安排。', labels: ['阅读', '记录', '活动'], note: '清单是原创练习，可按真实需要补充；园地原栏目和积累待核。' },
  'book-final-review': { kind: 'review', title: '只检查一个薄弱点', instruction: '选择字音、字形或阅读方法，再选单元小组独立尝试。', labels: ['字音', '字形', '阅读方法'], note: '只标具体需要再练的内容，隔几天换内容复查。背默按已核范围。' },
};

export function moveMaterial(order: number[], index: number, direction: -1 | 1): number[] {
  const position = order.indexOf(index), target = position + direction;
  if (position < 0 || target < 0 || target >= order.length) return order;
  const next = [...order]; [next[position], next[target]] = [next[target], next[position]];
  return next;
}
export function getWorkshopFields(id: string, task: CompanionTask) {
  const spec = companionWorkshops[id];
  return task.fields.map((field, index) => ({ ...field, label: spec?.labels[index] || field.label }));
}
export const companionWorkshopIds = chineseBookCompanions.map(item => item.id);
