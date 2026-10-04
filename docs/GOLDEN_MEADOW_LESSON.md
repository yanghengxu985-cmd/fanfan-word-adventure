# 《金色的草地》精修课件

本课接续《搭船的鸟》的制作标准，服务三年级学生理解课文、认读字词和独立纸笔练写，也供教师投屏。采用直接切换的观察手册，不增加关卡解锁或强制多步操作。

## 教学与交互

- 看草地变化：直接选择早晨、中午、傍晚，草地中的同株黄色蒲公英与近看窗口同步开合。18秒时间线只是示意播放进度，可暂停、重播和拖动，不是真实钟点。
- 近看蒲公英：同株花朵展开、合拢直接对照，理解黄色花瓣显露或被包住。叶茎保留相同位置，不把黄花变成白色绒球再变回黄花。
- 字词练写：会认字6个，会写字13个，课内词语11个；同一字同时属于会认与会写时，仍按所选类别提供认读或书写指导。遮字时隐藏字库、词例及其他答案提示。独立书写在纸上完成，展开后核对易错点。
- 读懂观察：区分看到的现象与解释原因，比较不同时段，再走近细看；迁移到身边事物的连续观察。选择题反馈提供具体依据，不生成掌握记录。
- 页面直接切换、教师参考答案、资料说明及一页打印。字词工作台独立封装，后续课件可传入各自字词和专项指导。

## 教材边界

用户纸本为人教社三年级上册2025年6月第1版、2026年7月第2次印刷，ISBN 978-7-107-39754-7；目录已核对。本课对应第62—64页，字词范围依据项目采用的2025新版公开预览和书后词表。2026纸本正文、课后题及背诵默写范围仍待逐项复核，paperVerified保持false；不自行添加整课必背或必默要求。

会认：蒲、英、耍、茸、欠、拢。

会写：蒲、英、盛、耍、使、劲、脸、欠、朝、钓、察、拢、喜。

词语：草地、蒲公英、盛开、玩耍、一本正经、使劲、钓鱼、观察、合拢、张开、喜爱。

逐字拼音、部件、易错指导及词义在src/data/goldenMeadowLesson.ts维护，保留本课语境读音与多音字区别，不改全册待核标记。页面使用现有合成MP3词音频；没有对应音频的单字不调用设备TTS。

画面是依照课文描述的时段变化示意，不能由此断言所有真实蒲公英都在固定钟点开合。讲解、词义说明和阅读题为原创辅助，不复制现代课文全文。

## 内容核对来源

- [人教社教材编辑说明](https://www.pep.com.cn/xw/zt/hd/zjywjytbskjc/201905/t20190516_1938221.html)：第五单元留心观察，连接阅读与表达；2019文章用于教学原则参考。
- [人教社2025修订说明](https://www.pep.com.cn/bks/xxyw/jzjd/202510/W020251016516675066625.pdf)：新版单元目标与要求调整。
- 项目采用的2025新版公开预览：第三方展示，同目录字词表范围参考，2026纸本待核；完整链接在页面资料说明及数据sources中。
- 汉典逐字核对，例如[茸](https://www.zdic.net/hans/%E8%8C%B8)、[朝](https://www.zdic.net/hans/%E6%9C%9D)、[劲](https://www.zdic.net/hans/%E5%8A%B2)、[一本正经](https://www.zdic.net/hans/%E4%B8%80%E6%9C%AC%E6%AD%A3%E7%BB%8F)；保留词典本调，另说明词中变调和语境读音。

## 图像资产与提示

内置imagegen模式生成，未使用CLI/API回退。图片已复制到项目public/images/golden-meadow，保留生成原件。草地底图1536×1024 RGB；开/合单株均1254×1254 RGBA，透明alpha范围0—255，叶茎位置配对。

- public/images/golden-meadow/meadow-landscape-v1.png
- public/images/golden-meadow/dandelion-open-v1.png
- public/images/golden-meadow/dandelion-closed-v1.png

### 草地背景

Use case: illustration-story and scientific-educational. Create a premium richly detailed hand-painted nature-book illustration as the scenery background of a Chinese Grade 3 lesson 'Golden meadow'. Landscape 3:2 full-bleed canvas. Viewer is standing low at the edge of a fresh green grassy meadow, a lush field fills the lower 70% of the image, soft distant tree hedges and low hills at y30%, small airy pale cream-blue sky upper third. Foreground grass is natural detailed slender grass blades and low broad dandelion-like serrated leaf rosettes, with fine watercolour/gouache texture; plants in distance get smaller with depth. A subtle curving earth footpath enters the lower left edge, leading toward the distant upper left, does not cross the main centre meadow. Neutral gentle daylight, spring fresh greens, olive and sage shadow, elegant nuanced children's science-book painting, coherent natural perspective, immersive landscape close enough to see delicate grasses, no flat vector shapes. The broad central meadow should be quiet and open enough for separate code-animated dandelion flower plants to be overlaid. Absolutely NO yellow open flowers, NO white dandelion puffballs, NO flowers of any kind, NO people, NO animals, NO text, NO letters, NO labels, NO border, NO watermark, no diagram, no decorative sun circle, no building. This is only the scenery layer, all dandelion flower heads will be animated separately in code.

### 展开的蒲公英

Use case: scientific-educational illustration. Create ONE complete botanical dandelion plant cutout on a genuinely fully TRANSPARENT square canvas, no backdrop at all. Premium detailed hand-painted nature-book watercolour/gouache style, delicate but clearly legible for classroom projection, realistic natural proportions. A SINGLE vivid golden yellow dandelion flower head FULLY OPEN is centred at x50% y25%; its slender green slightly curved stem runs down toward root/base at x50% y88%. Open head is viewed obliquely from the side-above, clearly showing many fine yellow strap-shaped florets radiating outward, flower head width approximately 40% of canvas. A compact rosette of five natural dark fresh green serrated long leaves spreads horizontally across x15%-85% at y70%-90%, leaves in natural side view, a few gentle curves. Entire plant fits inside canvas with 8% transparent margin. One stem and one yellow head only, NO white puffball, NO buds or other flower heads, no roots below the rosette, no ground, no soil, no shadow, no container, no border, no text, no labels, no symbols. Plant should resemble a natural herbaceous dandelion, not a daisy with thick separated round petals, not a sunflower. In a follow-up edit this SAME head will close while stem and leaves remain in exactly the same positions, so this pose should be calm, well aligned, and easy to pair with an identical plant. Preserve true alpha transparency outside all plant parts.

### 同株花朵合拢的编辑

参考展开单株，仅编辑花头；保留透明背景和叶茎位置。

Edit the supplied transparent botanical dandelion image into the CLOSED flower state of the EXACT SAME plant. Preserve the original square canvas dimensions, true transparent alpha background, stem curve, ALL leaves, leaf positions, leaf textures, plant root and all plant geometry below the flower EXACTLY pixel-aligned to the original. Only change the TOP FLOWER HEAD near x50%, y20%-25%: the golden yellow florets now fold and gather inward into a narrow upright CLOSED head, viewed at the same camera angle; green outer bracts enclosing the lower closed head, very little yellow visible just as a thin tip, at most 5% of the original yellow area. The closed head is a slim green tapered oval, not a giant unopened bud, no petals spread sideways; its base attaches to precisely the same stem tip as before, and head must remain centred on the same x coordinate. This represents the SAME already flowering dandelion closing for the evening, NOT ageing, NOT seeds, NOT a white puffball. Do not change leaf shape, leaf colour, stem length, orientation, scale, spacing or canvas crop. Retain premium detailed hand-painted watercolour/gouache botanical illustration quality and genuinely transparent background. No soil, no shadow, no labels, no text, no borders, no extra flowers. Maintain exact square size and plant alignment for crossfading in classroom software.

## 验收

2026-10-04：184项自动测试通过，TypeScript检查和正式构建完成。正式构建预览的66项浏览器检查通过，无页面异常或失败资源。平板尺寸为Chromium模拟，实体iPad/Safari效果仍以实际试用为准。

| 检查 | 实际结果 |
| --- | --- |
| 教学清单及读音 | 会认6、会写13、词语11完整；茸仅会认，朝cháo、盛shèng、劲jìn按本课语境；2026纸本核验状态保持待核。 |
| 三时段与近看 | 早晨和傍晚合拢、中午展开，场景与近看同步；草叶底图颜色固定，金色来自77株花头显露，无全场黄滤镜。 |
| 播放与过渡 | 播放向前推进，播放中重播从头继续；暂停后进度与开合层保持不变，过渡文字不宣称完全合拢或展开。 |
| 字词与练写边界 | 会认类别只练认读，词语纸笔练写明确为自选；词内换聚焦字不改变练习类别；遮字时字库、标题、词例一并隐藏。 |
| 音频与资源 | 三张图片请求200，蒲公英MP3实际请求206；场景图片根据document.baseURI绝对解析，支持Pages子路径。 |
| 平板布局 | 1024×768横屏、768×1024竖屏、1024×700较矮横屏主操作同屏，无横向溢出；竖屏阅读图与观察表并排，配图约409×273。 |
| 个人记录及回归 | 操作前后localStorage保持不变；本课组件不显示或写入个人成绩。搭船的鸟及英语地图入口回归通过。 |
| 教师及打印 | 教师资料入口关闭弹窗，参考答案可展开；浏览器导出的A4练习纸为1页，已渲染目视检查，文字和表格完整。 |

本地正式构建QA脚本与截图在未提交的output/playwright/qa-golden-meadow-preview.js及golden-meadow-final-*.png；打印检查在output/pdf/golden-meadow-practice.pdf。共享样式在正式构建中曾覆盖同优先级的草地布局，已对草地规则统一加作用域，重新构建后竖屏图表和同屏操作检查通过。

发布目标：[本课](https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/cn-15)、[教师投屏](https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/cn-15/teacher)。公开发布结果以GitHub Actions及实际网址核验为准。本次精修新增这一课；全册其他课件继续保留现有版本。
