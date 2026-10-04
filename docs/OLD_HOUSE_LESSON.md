# 《总也倒不了的老屋》精修课件

本课对应三年级上册第8课，接续《搭船的鸟》《金色的草地》的精修标准。用原创情境插图、短概述和可直接操作的阅读停顿，配合纸质课文使用。

## 教学与交互

- 看故事线索：四个阅读位置可以直接选择，只显示当前位置已经读到的信息；不提前展示后面的访客或作者安排。
- 试着预测：直接选择第一、第二、第三处，选一个预测、勾选依据后可看后文。也允许不作答就读后文，没有关卡解锁或必答门槛。
- 每处有不止一个有依据的预测。反馈检查预测与已读线索的联系；作者实际安排不参与预测对错判定。揭示后保留刚才的预测和线索，可选择保留或调整想法，重试由学生主动选择。
- 字词练写：完整会认、会写及课内词语清单，拼音、部件、易错点和原创词例；会认类只练认读，自选词语书写与教材会写范围分开。遮字时隐藏字库及标题中的答案提示。
- 读懂预测：在已读信息里找依据，分清线索、预测和作者后文；用原创小情境练习迁移，不把预测变成背课文答案。
- 教师投屏、资料说明和一页A4练习纸。主要操作在平板横竖屏内直接可见，字词语音复用现有固定MP3。

## 教材范围

用户纸本为人教社三年级上册2025年6月第1版、2026年7月第2次印刷，ISBN 978-7-107-39754-7。目录中的本课从第28页开始；完整2026纸本正文、课后题及背默范围尚未逐项核对，paperVerified保持false，不另加整篇必背或必默。

会认（8）：眯、哦、喵、孵、叽、缝、偶、尔。

会写（11）：屋、板、准、备、等、暴、哦、钻、爬、漂、晒。

课内词语（14）：门板、准备、旁边、暴风雨、安心、低头、吃力、再见、母鸡、注意、屋子、漂亮、意思、因此。

字词清单沿用项目所用的2025新版同目录公开预览与书后词表。哦同时在会认和会写中，工作台按实际选择类别给不同要求。现代课文仅提供原创短概述、教学提示和练习，不复制教材全文。故事为童话情境，插图是原创艺术解释。

## 制作资料

课程数据与逐字核对来源在src/data/oldHouseLesson.ts维护；预测教学优先依据人教社教材编辑的说明。公开预览为第三方展示，不能代替用户2026纸本的逐项校验。

- [人教社编辑孙浩浩：如何开展有效预测（2025）](https://www.pep.com.cn/bks/xxyw/jzjd/202506/W020250624356987921486.pdf)：教学参考，选择有价值的停顿，提出预测后继续阅读并比较。
- [人教社阅读策略教学说明（2025）](https://www.pep.com.cn/bks/xxyw/jzjd/202505/W020250531418254738022.pdf)：从教师示范逐渐走向独立运用。两份PDF的搜索索引可读，打开完整原页曾超时；不据此宣称逐页核验。
- 课内字音对照汉典，例如[哦](https://www.zdic.net/hans/哦)、[缝](https://www.zdic.net/hans/缝)、[钻](https://www.zdic.net/hans/钻)、[漂](https://www.zdic.net/hans/漂)；保留语境读音与不同读音的组词区别。

## 图像资产与提示词

使用内置imagegen生成，未使用CLI/API回退。原件保留在生成目录，选定图片复制到public/images/old-house。老屋底图为1536×1024，三个访客为单独透明PNG；只加载并呈现当前位置的访客。

网页使用浏览器原生Canvas按质量0.94重新编码的WebP，尺寸、构图和透明通道保持不变；picture元素保留PNG兼容回退。四张WebP共约2.34MB，PNG共约8.10MB，减少约71%的配图下载量。生成原件与项目PNG均保留。原始透明访客均1254×1254 RGBA，alpha范围0—255；已核对三个访客的PNG与WebP透明通道逐像素一致，底图仍为1536×1024 RGB。WebP的颜色编码为有损压缩，不声称与PNG全部像素一致。

- public/images/old-house/old-house-landscape-v1.png
- public/images/old-house/cat-v1.png
- public/images/old-house/hen-v1.png
- public/images/old-house/spider-v1.png

### 老屋底图

Use case: illustration-story. Asset type: landscape background illustration for a polished Chinese grade-three interactive reading lesson about 《总也倒不了的老屋》. Create a landscape 3:2 full-bleed children's literary picture-book illustration, painterly gouache with fine ink and luminous paper texture, elegant and richly detailed rather than flat vectors. A very old but still standing small rural Chinese house sits slightly left of center, fully visible: warm weathered wooden planks and earthen walls, a gently sagging dark clay-tiled pitched roof, a few imperfect shingles, moss along the lower walls, a simple open doorway, two old wooden windows. It feels patient, kindly, inhabited by memories; no giant cartoon face. A narrow garden path approaches the doorway from the right foreground, with plenty of open natural ground on the right for later interactive character overlays. Quiet woodland, grasses, ferns, a few autumn leaves, distant pale hills. Soft calm daylight, warm parchment, muted olive and terracotta palette, clear readable house silhouette, cinematic but age-appropriate cozy atmosphere. No animals, no people, no spider, no chicks, no eggs, no hints of future events. No text, labels, logos, numbers or watermark. Keep all key content inside frame, house foundation visible, no excessive empty sky. This is an original interpretation, not a copy of textbook artwork.

### 小猫

Use case: illustration-story. Asset type: single character cutout for a Chinese third-grade illustrated reading lesson. Premium gouache watercolor with delicate ink, warm natural russet/olive palette, detailed elegant children's picture-book style, natural proportions, gentle expressive but no clothes, no props, no speech bubble or text. Single animal fully visible on a genuinely TRANSPARENT square canvas, true alpha outside animal, no background, no ground, no cast-shadow, no borders, no text or watermark, ample transparent margin. One small orange-brown tabby kitten, standing in a quiet three-quarter side view facing left, paws together and tail gently curved upward; attentive inquisitive face looking a little upwards toward an old house doorway. Four paws, two ears, no cartoon smile, soft detailed fur. The kitten occupies the middle 72% width and 65% height of the canvas.

### 母鸡

Use case: illustration-story. Asset type: single character cutout for a Chinese third-grade illustrated reading lesson. Premium gouache watercolor with delicate ink, warm natural russet/olive palette, detailed elegant children's picture-book style, natural proportions, gentle expressive but no clothes, no props, no speech bubble or text. Single animal fully visible on a genuinely TRANSPARENT square canvas, true alpha outside animal, no background, no ground, no cast-shadow, no borders, no text or watermark, ample transparent margin. One small russet brown mother hen, calm three-quarter side view facing left, body crouched slightly, two feet visible, red comb and wattle, short golden beak, layered natural brown feathers and gently curving tail. No eggs, chicks, rooster or nest. She occupies the middle 72% width and 70% height of the canvas.

### 蜘蛛

Use case: illustration-story. Asset type: single character cutout for a Chinese third-grade illustrated reading lesson. Premium gouache watercolor with delicate ink, warm natural russet/olive palette, detailed elegant children's picture-book style, natural proportions, gentle expressive but no clothes, no props, no speech bubble or text. Single animal fully visible on a genuinely TRANSPARENT square canvas, true alpha outside animal, no background, no ground, no cast-shadow, no borders, no text or watermark, ample transparent margin. One small friendly biologically recognizable brown garden spider, oval small head and abdomen, eight slender curved legs, viewed from above in a gentle symmetrical splayed pose, non-frightening naturalistic insect-book style, tiny subtle eyes, no giant eyeballs or teeth. A few extremely fine silk strands behind it forming a small irregular transparent orbweb, isolated on true alpha, no branch or plant. Spider occupies middle 55% canvas and delicate web about 78%. No prey, no additional animals.

## 验收与发布

本地实现已完成，当前验收结果：

- `npm test`：197项自动测试全部通过，覆盖课程数据、预测依据、揭示前后状态及已有功能。
- `npm run build`：正式构建通过。
- 正式构建的preview浏览器自动检查：84项全部通过，涵盖预测与依据、后文揭示、字词及音频、教师入口和已有课程入口回归。
- 1024×768、1024×700、768×1024三个模拟视口中，主要控件可见并可点击；这是浏览器视口检查，不替代实体iPad试用。
- A4练习纸输出为1页。
- 配图尺寸、文件大小及透明通道已核对，故事、预测、字词、方法页及打印页已逐一查看截图。蜘蛛采用放大观察图，避免在树林底图中难以辨认。
- 最终配图与布局追加37项浏览器检查通过，覆盖三个模拟视口中的访客图片加载、名称不折行、画面边界和操作点击。

尚未进行本次公开发布；上线后还需确认GitHub Actions结果与实际课程网址。

目标链接：[本课](https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/cn-08)、[教师投屏](https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/cn-08/teacher)。公开发布以GitHub Actions结果及实际网址校验为准。
