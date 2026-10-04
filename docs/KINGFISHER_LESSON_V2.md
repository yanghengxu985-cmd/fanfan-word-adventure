# 《搭船的鸟》独立课件：制作与验收标准

本课作为全册课件的质量样板，服务三年级学生理解课文、识写字词，以及老师投屏教学。重点是有依据的观察、准确的动作词和本课实际字词，不增加闯关解锁或强制操作步骤。

## 教学与交互

- 观察页：翠鸟的羽毛、翅膀和长嘴有清楚的部位与颜色；图上部位和文字说明直接联动。
- 捕鱼页：16秒连续演示，支持暂停、重播、拖动时间和点动词定位。飞起时已经衔鱼，回到船头仍衔鱼，吞下后才没有鱼。
- 字词页：沿用本课已整理的5个会认字、13个会写字、8个词语。5个会认字分别有字音、识认线索、短释义和语境示例；13个会写字全部有部件、易错点、组词指导，实际书写在纸上完成。
- 阅读页：问题围绕外形观察、动作词的准确性和观察转写；反馈指出具体依据，不把选对答案称为掌握。
- 普通模式和老师模式均不读取或保存个人学习记录。播放、点选、遮挡字卡、纸笔核对和答题都不生成“已掌握”标记，也不改变其他课的学习状态。
- 所有主要切换和播放按钮在平板一屏可用；短屏可以局部滚动内容，主操作不埋在页面底部。

### 会认字专项认读

内容来自 `src/data/kingfisherLesson.ts` 的 `birdRecognitionFocus`，与本课会认字清单逐项对应。这些是人工核对的本课辅导读音；不修改全册字词数据的 `readingVerified` 状态，也不把会认字改为必写字。

| 字 | 辅导拼音 | 词语或课内语境 | 专项认读重点 |
| --- | --- | --- | --- |
| 舱 | cāng | 船舱 | 舟字旁帮助联系船；第一声，后鼻音 ang；与“仓”同音。 |
| 啦 | lā | 沙啦沙啦、哗啦 | 本课模仿雨点打在船篷上的声音，“沙啦沙啦”读 shā lā shā lā；“来啦”的句末语气词读轻声 la。 |
| 鹦 | yīng | 鹦鹉 | 鸟字旁提示鸟类；第一声，后鼻音 ing；和“鹉”连起来认读。 |
| 鹉 | wǔ | 鹦鹉 | 左边“武”字形提示读音，第三声；“鹦鹉”读 yīng wǔ。 |
| 衔 | xián | 衔着小鱼、衔住 | 第二声，韵母 ian 是前鼻音；用嘴含住，区别于把鱼吞下。 |

会认字重在放回词语读准、联系语境理解；遮住字卡后的自我尝试用于发现还需再练之处。会写字还需在纸上独立书写后对照字形。以上操作均不自动判定掌握。

### 教材版本与内容边界

项目记录的教材为人教社《义务教育教科书 语文 三年级 上册》，ISBN 978-7-107-39754-7，2025年6月第1版；用户纸本为2026年7月第2次印刷。当前内容和字词范围参考同26课目录的2025新版公开预览；预览由第三方托管，印次未明确。

本课内容定位在第60—61页；字词依据公开预览的识字表第109—111页、写字表第112—113页、词语表第114—116页。用户2026纸本的正文、课后题、字词表以及具体背诵、默写范围仍待逐项复核，项目的 `paperVerified` 保持为 `false`。待核不表示没有要求，本课件不自行添加整课必背或必默任务。

讲解、观察提示、换词对比和阅读题为原创辅助；只引用必要的短词，不整篇复制现代课文。动画16秒为演示时长，不作为真实捕鱼耗时；“飞”和“衔”对应同一画面中的观察，不设计为必须依次发生的两个独立动作。

## 图像资产

使用内置 imagegen 生成以下项目资产，没有使用 CLI/API 回退。原始生成文件留在 Codex 的 generated_images 目录，项目使用副本。

- `public/images/kingfisher/river-scene-v2.png`（[实际文件](H:/AI-Project/教材/word-adventure/public/images/kingfisher/river-scene-v2.png)）：1536×1024，河流、木舟、竹篷、柳树、远山，作为场景底图。
- `public/images/kingfisher/kingfisher-poses-v2.png`（[实际文件](H:/AI-Project/教材/word-adventure/public/images/kingfisher/kingfisher-poses-v2.png)）：1536×1024，真实透明背景的3列2行翠鸟姿态图集；依次为停鸟、俯冲、飞起衔鱼、站定衔鱼、吞鱼、吞后停鸟。
- `public/images/kingfisher/kingfisher-flight-down-v2.png`（[实际文件](H:/AI-Project/教材/word-adventure/public/images/kingfisher/kingfisher-flight-down-v2.png)）：1254×1254，真实透明背景的衔鱼下拍翼姿态；飞行时与上拍翼图层交替，暂停后冻结。

### 场景生成提示

Use case: illustration-story / scientific-educational. Asset: final landscape background for a polished Chinese Grade 3 reading lesson about a kingfisher riding on a river boat. Create a premium children's nature-book hand-painted illustration, landscape approximately 3:2. Scene: a quiet southern Chinese river on a soft cloudy day just after light rain, delicate grey-blue mist, layered distant wooded green hills, atmospheric perspective, carefully painted willows/reeds, subtle water reflections, understated fine brush textures. Main foreground: a traditional small wooden river boat entering from the bottom-left, covered bamboo canopy toward the left and open pointed bow toward the right. Clear worn wood grain and wet edge details. The tip of the open bow must form a visible perch at about x=34% of image width,y=64% of image height. Boat occupies the left lower third only. Keep broad unoccupied river water around x=65%-85%,y=65%-85% for the bird to dive into later. Water horizon begins around y=48%, foreground water around y=75% is clear with subtle ripples. Composition should be an immersive close scene, not a distant tiny boat on blank mountains. Carefully balanced olive foliage, teal river, amber wood, muted creamy light. Sophisticated engaging realistic storybook rendering, painted detail with natural proportions, clear readable foreground, no cartoon primitives, no flat vector clipart. This asset is the scenery layer only: ABSOLUTELY NO BIRDS, no fish, no people or animals, no text, no letters, no labels, no frames, no diagram, no watermark. No decorative sun circle. Full-bleed artwork. A separate bird will be animated over this background in code. The wood bow must be clearly visible and have enough quiet space above it for a bird.

实际生成后以画面校准船头坐标，不依赖提示中的预期坐标。

### 翠鸟图集生成提示

Use case: scientific-educational. Asset: a transparent sprite sheet used as the actual kingfisher in a polished elementary reading lesson. Create ONE 3-column by 2-row grid atlas, exactly SIX equal rectangular cells, landscape canvas 3:2. Background genuinely fully transparent, no painted or white backdrop, no cell lines, no text or labels, no ground, no shadows, no branches. EACH cell must contain ONE complete small common kingfisher, identical character proportions, premium richly detailed hand-painted nature-book illustration with accurate anatomy: shimmering emerald green upper head/back feathers, distinctly blue wings with detailed feather layers, pale orange/cream chest, long slender vermilion red bill, small dark eye and short orange feet. No generic round cartoon bird; realistic recognizable kingfisher in a coherent illustrated style. All birds generally face RIGHT, a consistent emerald green head, blue wing and long red beak must be readily visible in every pose. All six drawings fit INSIDE their own equal cell with generous 12% transparent padding, no spillover. Drawings centered within their cell; perched poses have feet near 84% of cell height. Order, read left-to-right then top-to-bottom: TOP LEFT [cell0] perched side view, feet gripping an invisible edge, wings folded, head level facing right, NO fish. TOP MIDDLE [cell1] diving down diagonally to the right at a 45-degree angle, streamlined body, swept wings, bill pointing lower-right, NO fish. TOP RIGHT [cell2] flying toward the right, wings raised in mid-stroke, in the red bill securely holds ONE small silver fish CROSSWISE clearly visible beneath the beak; fish is held in the bill not floating nearby. BOTTOM LEFT [cell3] perched again wings folded, facing right, feet at same position as cell0, STILL holding the SAME small silver fish crosswise firmly in the bill. BOTTOM MIDDLE [cell4] perched facing right with head tilted upward, swallowing the fish headfirst; only the small tail and part of fish remain visible in the raised bill, same body/perch baseline. BOTTOM RIGHT [cell5] perched side view after swallowing, identical to cell0, calm folded wings, closed bill, NO fish. Precise equal-grid alignment and individual subjects are essential to CSS sprite use. Each pose must be beautiful enough to show enlarged as a classroom observation illustration. Avoid oversized yellow beaks, simple ellipses, flat SVG style, water or any environmental object. Preserve genuine transparent alpha across the entire spaces between birds.

### 下拍翼生成提示

Use case: scientific-educational. Generate one NEW transparent animation frame. The provided six-pose atlas is ONLY a reference for the SAME kingfisher character, exact feather colours, natural-book illustration style and red bill; do not recreate the atlas. Output exactly ONE complete flying kingfisher on a genuinely transparent square canvas, facing RIGHT and STILL securely holding the same silver fish CROSSWISE in its red bill. This is the DOWNSTROKE phase of the atlas's flying-with-fish top-right pose: spread the BLUE wings DOWN and out, detailed overlapping feathers, while preserving the head/body/beak/fish position so it can alternate with the upstroke. Emerald-green head and back, blue wings, cream/orange chest, long slender vermilion bill, detailed dark eye. Composition/alignment on square: head centred around x77%,y56%, beak tip around x94%,y60%, body centre around x48%,y66%, tail toward x8%,y82%; wing feathers fan DOWN from the back toward the lower-right/lower-centre while head remains level facing right. Small fish remains visibly pinched in the bill, not dropped or swallowed. No background, no water, no shadow, no branch, no letters, no labels, no borders. No detached limbs or duplicate wings. Generously detailed premium hand-painted nature-book illustration, identical character identity to reference, accurate natural anatomy. Keep everything within the square with 3%-5% transparent margin. The output will be a code-animated wingbeat frame, not a standalone diagram.

## 内容核对来源

- [人教社教材编辑说明](https://www.pep.com.cn/xw/zt/hd/zjywjytbskjc/201905/t20190516_1938221.html)：观察单元的阅读与表达关系。
- [人教社《小学语文》教学案例](https://www.pep.com.cn/bks/xxyw/jzjd/202505/W020250531413258927110.pdf)：捕鱼动词理解与表达迁移。
- [项目采用的2025新版公开预览](https://www.scribd.com/document/1067004050/%E4%BA%BA%E6%95%99%E7%89%88-%E4%B8%89%E5%B9%B4%E7%BA%A7%E4%B8%8A%E5%86%8C-2025%E7%A7%8B%E7%89%88-%E8%AF%AD%E6%96%87%E7%94%B5%E5%AD%90%E8%AF%BE%E6%9C%AC)：交叉核对本课第60—61页与书后字词表；2026纸本待复核。
- [人教社“吞”范写](https://www.pep.com.cn/jxzy/xzzq/xzsp/tbxz/3s/202110/t20211020_1971245.html)，汉典现代字形及笔顺：逐字复查易错点；“亲”末笔是点，独立“羽”有钩、“翠”上部不带钩。
- 会认字字音、字形和语境释义：[舱](https://zdic.net/hans/%E8%88%B1)、[啦](https://zdic.net/hans/%E5%95%A6)、[鹦](https://zdic.net/hans/%E9%B9%A6)、[鹉](https://zdic.net/hans/%E9%B9%89)、[衔](https://zdic.net/hans/%E8%A1%94)。这些字条已作为 `birdLessonCopy.sources` 的专项认读来源。

## 验收记录

2026-10-04：Windows 本地 Vite 开发服务器及 Chromium 实测。`npm test` 的 175 项测试全部通过，`npm run build` 完成。补充浏览器实际操作检查 31 项通过，未出现页面异常、控制台错误或缺失资源。下列尺寸为浏览器模拟的 CSS 视口，不代替实体 iPad 试用。

| 检查项目 | 实际记录 |
| --- | --- |
| 教材内容、会认字与会写字范围核对 | 5 个会认字、13 个会写字、8 个词语与当前项目清单一致；衔不列入会写字。2026 纸本课后要求保留待核。 |
| 时间线及衔鱼状态测试 | 纯进度模型测试覆盖路径连续、入水隐去、出水衔鱼、回船仍衔鱼、吞后空嘴和边界数值；均通过。 |
| 暂停、重播、拖动、动词跳转与拍翼冻结 | 实测播放向前推进，播放中重播后从头继续；暂停后进度、鸟的位置和拍翼图层透明度保持不变。5 个动词可直接定位，拖到终点显示吞后空嘴。 |
| 字词显示、专项认读与现有音频检查 | 五字专项读音逐项核对；遮字时清单及组词一并隐藏，纸稿核对不生成掌握记录。翠绿 MP3 请求返回 206、显示播放状态，切页停止播放。 |
| 平板布局、短屏滚动与控制按钮 | 1024×768 横屏、768×1024 竖屏、1024×700 较矮横屏实测；切换、播放控制及阅读反馈未超出视口，未见横向溢出。竖屏场景约 494×329。 |
| 老师模式、个人记录边界与其他课入口回归 | 教师链接关闭资料窗，展示参考答案有效；组件未调用个人进度写入。山行原页面和英语港湾入口已打开检查。 |
| 发布地址、发布结果与发布后检查 | 目标：[搭船的鸟](https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/cn-14)，[教师投屏](https://yanghengxu985-cmd.github.io/fanfan-word-adventure/#/chinese-lesson/cn-14/teacher)。最终发布状态以 GitHub Actions 和公开网址检查结果为准。 |

本地截图位于未提交的 `output/playwright/kingfisher-v2-final-observe.png`、`kingfisher-v2-final-reading.png` 和 `kingfisher-v2-final-portrait.png`；浏览器检查脚本同目录保存。当前仅重做这一课，其他课件仍使用各自现有版本。

发布检查发现并修正 CSS 变量中的相对图片地址会相对于 `assets/` 样式目录解析的问题；场景图片统一先根据 `document.baseURI` 解析为绝对地址，再用于 HTML 和 CSS，以保留 GitHub Pages 项目子路径。修正后重新执行 175 项测试和正式构建，均通过；公开网址上的三张图片与 MP3 仍需等待该次部署后逐一检查。
