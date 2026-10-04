# 全册精修：原创总览图资产与核验记录

核验日期：2026-10-04。状态：27 张总览图已生成、逐图视觉复核并完成文件校验，插画资产可用于后续整合。网页部署、动态交互和教材正文核验不由此记录宣称完成。

## 生成方式和用途

使用已读取的 imagegen 技能，全部通过内置 `image_gen__imagegen`：27 次独立首次生成 + 4 次定向图片编辑。未使用 CLI、API 密钥、网上下载素材或脚本绘图。每课使用独立场景提示词，实际传入的完整提示词见下文。首次生成参数均为 `{prompt, transparent_background: false}`，不传参考图；修复时仅传入对应本地 v1 PNG 的 `referenced_image_paths`，不同时使用历史对话图片参数。

27 图覆盖 21 篇编号课文及 6 首古诗。已精修的 cn-08、cn-14、cn-15 原有插画沿用，不在本次图表内；6 首诗作为 cn-04、cn-20 内的各单篇资产，不代表两节“古诗三首”整课已验收。

所有最终图均为 **1536 × 1024、3:2 横幅、RGB**。统一细腻水粉与水墨纸纹、自然色彩的三年级文学绘本表达，各图围绕自己的课题。插画是原创情境示意，不能冒充教材插图、逐字正文证据、历史照片、真实物种或地形复原。构图中新增的配角和环境细节只服务文学氛围，不供学生当作课文事实背记。

预测课只画开篇或已读观察情境，不提前画未来来客、关键选择或结局。cn-18 只有春林总览；yinhushang 只有晴雨湖色的静态总览；互动状态变化须另有真实交互或标明“方法示意”，不以重复使用静态图冒充动画完成。

## 路径、原图保留和格式编码

仓库根：`H:/AI-Project/教材/word-adventure`。

- 发布目录只保留 canonical WebP：`public/images/chinese-precision/<id>.webp`，共 27 文件，**17,421,878 bytes（约 16.61 MiB）**。
- 内置生成器原件仍留在 `C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/`，没有删除或改写。
- PNG 的仓库内本地副本放在 **ignored** `output/chinese-precision-images/`。27 首稿 + 4 修复稿，共 31 PNG，仅本地保留，不进入 Git 或网页部署；最终使用版本是表中对应 v1/v2。v2 的旧 v1 仅作修复记录保留。
- 移动原 PNG 前已核对 workspace、源目录、目标目录的解析绝对路径均在上述仓库内。没有递归移动或删除，也没有跨 shell 拼接文件操作。
- PNG → WebP 使用 Pillow 的纯格式编码 `im.save(path, format='WEBP', quality=94, method=6)`。未裁切、改尺寸、调色、绘字、去物体或做画面编辑。所有语义修复均由内置 imagegen 完成。WebP 是有损编码，质量 94，不能称像素完全一致或无损；尺寸、纵横比和画面内容保持不变。

| ID | 课题 / 用途 | 发布文件 | 本地 PNG 最终版本 | WebP bytes |
| --- | --- | --- | --- | ---: |
| cn-23 | 司马光总览 | `public/images/chinese-precision/cn-23.webp` | `output/chinese-precision-images/cn-23-v1.png` | 598022 |
| wangdongting | 望洞庭总览 | `public/images/chinese-precision/wangdongting.webp` | `output/chinese-precision-images/wangdongting-v1.png` | 466962 |
| shanxing | 山行总览 | `public/images/chinese-precision/shanxing.webp` | `output/chinese-precision-images/shanxing-v1.png` | 772976 |
| yeshusuojian | 夜书所见总览 | `public/images/chinese-precision/yeshusuojian.webp` | `output/chinese-precision-images/yeshusuojian-v1.png` | 635526 |
| luchai | 鹿柴总览 | `public/images/chinese-precision/luchai.webp` | `output/chinese-precision-images/luchai-v1.png` | 734434 |
| wangtianmenshan | 望天门山总览 | `public/images/chinese-precision/wangtianmenshan.webp` | `output/chinese-precision-images/wangtianmenshan-v1.png` | 595976 |
| yinhushang | 饮湖上初晴后雨总览 | `public/images/chinese-precision/yinhushang.webp` | `output/chinese-precision-images/yinhushang-v1.png` | 633592 |
| cn-01 | 大青树下的小学总览 | `public/images/chinese-precision/cn-01.webp` | `output/chinese-precision-images/cn-01-v1.png` | 662880 |
| cn-02 | 花的学校总览 | `public/images/chinese-precision/cn-02.webp` | `output/chinese-precision-images/cn-02-v1.png` | 782756 |
| cn-03 | 不懂就要问总览 | `public/images/chinese-precision/cn-03.webp` | `output/chinese-precision-images/cn-03-v1.png` | 430570 |
| cn-05 | 铺满金色巴掌的水泥道总览 | `public/images/chinese-precision/cn-05.webp` | `output/chinese-precision-images/cn-05-v1.png` | 786402 |
| cn-06 | 秋天的雨总览 | `public/images/chinese-precision/cn-06.webp` | `output/chinese-precision-images/cn-06-v1.png` | 835194 |
| cn-07 | 听听，秋的声音总览 | `public/images/chinese-precision/cn-07.webp` | `output/chinese-precision-images/cn-07-v1.png` | 644432 |
| cn-09 | 犟龟总览 | `public/images/chinese-precision/cn-09.webp` | `output/chinese-precision-images/cn-09-v1.png` | 743024 |
| cn-10 | 小狗学叫总览 | `public/images/chinese-precision/cn-10.webp` | `output/chinese-precision-images/cn-10-v1.png` | 758206 |
| cn-11 | 宝葫芦的秘密（节选）总览 | `public/images/chinese-precision/cn-11.webp` | `output/chinese-precision-images/cn-11-v1.png` | 490140 |
| cn-12 | 在牛肚子里旅行总览 | `public/images/chinese-precision/cn-12.webp` | `output/chinese-precision-images/cn-12-v1.png` | 636306 |
| cn-13 | 一块奶酪总览 | `public/images/chinese-precision/cn-13.webp` | `output/chinese-precision-images/cn-13-v1.png` | 529190 |
| cn-16 | 富饶的西沙群岛总览 | `public/images/chinese-precision/cn-16.webp` | `output/chinese-precision-images/cn-16-v1.png` | 667642 |
| cn-17 | 海滨小城总览 | `public/images/chinese-precision/cn-17.webp` | `output/chinese-precision-images/cn-17-v1.png` | 749042 |
| cn-18 | 美丽的小兴安岭总览 | `public/images/chinese-precision/cn-18.webp` | `output/chinese-precision-images/cn-18-v1.png` | 815802 |
| cn-19 | 香港，璀璨的明珠总览 | `public/images/chinese-precision/cn-19.webp` | `output/chinese-precision-images/cn-19-v2.png` | 604426 |
| cn-21 | 大自然的声音总览 | `public/images/chinese-precision/cn-21.webp` | `output/chinese-precision-images/cn-21-v1.png` | 858598 |
| cn-22 | 读不完的大书总览 | `public/images/chinese-precision/cn-22.webp` | `output/chinese-precision-images/cn-22-v1.png` | 745756 |
| cn-24 | 一定要争气总览 | `public/images/chinese-precision/cn-24.webp` | `output/chinese-precision-images/cn-24-v2.png` | 390052 |
| cn-25 | 手术台就是阵地总览 | `public/images/chinese-precision/cn-25.webp` | `output/chinese-precision-images/cn-25-v2.png` | 441148 |
| cn-26 | 一个粗瓷大碗总览 | `public/images/chinese-precision/cn-26.webp` | `output/chinese-precision-images/cn-26-v2.png` | 412824 |

## 逐图视觉复核

27 首稿的图像输出均实际查看；4 次定向修复的输出逐图查看后，又使用 `view_image(detail='original')` 查看最终 canonical WebP。以下记录针对最终版本，已按场景、明显伪文字、剧透和教学误导复核。插画验收不等于 iPad 页面上的裁切、按钮遮挡或视口布局验收。

| ID | 最终图观察与使用边界 |
| --- | --- |
| cn-23 | 庭院孩子与完整大瓮，地面平坦；没有落水、砸瓮、救援或假山。仅是故事开篇示意，不作为文言句意答案。 |
| wangdongting | 洞庭月色、平静水面与远处青绿小岛；没有把比喻中的银盘、青螺画成实物。 |
| shanxing | 上行石径、白云深处的房屋、红枫和停下的旧式马车；无现代车、文字或春季花朵。 |
| yeshusuojian | 秋夜江岸、风中梧桐、篱边儿童与小灯光；无巨型昆虫、文字或路牌。月色、村屋等属于诗意环境补充，不充当原诗逐字证据。 |
| luchai | 空林斜光照青苔；没有鹿、人物、动物或屋舍。主要视线落在林深与苔色。 |
| wangtianmenshan | 两岸青山与江流、远光中的一叶帆；无现代桥、字牌。山体尺度是诗意示意，不作为真实地形复原。 |
| yinhushang | 同一湖面由晴光过渡到雨雾，有柳枝、远山和亭；没有西施肖像或拼贴割线。儿童、小狗、亭桥为画面创作细节，不当教材事实；此图只负责总览。 |
| cn-01 | 大树荫下的山村小学、旧铜钟与互相问候的孩子；无校名、横幅或刻板民族装扮。多民族课文内涵须由正文教学说明，不能靠插画推断民族身份。 |
| cn-02 | 雨中白、黄、紫花丛与竹叶，水珠和花枝明显；没有花朵脸、文字或真实地下学校。拟人理解仍在课件里完成。 |
| cn-03 | 私塾里孩子举手提问、先生倾听；未画体罚或解释后的结果，书页无可读文字。不是孙中山的历史照片。 |
| cn-05 | 湿水泥路、梧桐掌状金叶与小水洼；近处叶脉和水珠清楚。未标地名或直接写出词义。 |
| cn-06 | 细雨中银杏黄叶、红叶、果实、村野与收获景；无大钥匙、文字或拟人雨滴。画面中的儿童、动物和建筑仅属创作环境，正文事实应另核。 |
| cn-07 | 飘叶、近景蟋蟀与远处雁群构成秋日节奏；无音符、字样或拟人乐器。蟋蟀使用前景透视，不作为真实大小比较图。 |
| cn-09 | 单独出发的乌龟与延伸小路；没有婚礼、狮王、途中劝阻动物或故事结果。未揭晓前可用。 |
| cn-10 | 独自站在分岔小路的小狗；没有公鸡、杜鹃、狐狸、猎人、枪械或结局。分岔场景用于开篇视觉引导，不等于原文地理事实。 |
| cn-11 | 祖母讲故事、男孩倾听；没有宝葫芦实物、宝物或得到葫芦的结局。 |
| cn-12 | 前景两只蟋蟀，远处牛吃草；没有被吞、内脏、胃部剖面或营救结局。昆虫前景放大是绘本构图，不是生物比例教学图。 |
| cn-13 | 蚂蚁共同搬完整奶酪；没有偷吃、碎渣或最后的分配结果。未揭晓前可用。 |
| cn-16 | 一条连贯水线连接海岛、海面与珊瑚鱼群；无地名、地图标注或旅游照片声明。具体鱼种、海龟及岛屿轮廓不能充当教材已核事实。 |
| cn-17 | 绿荫中的海滨小城、院落、白墙和渔船；无门牌、地图或城市名。小女孩、小狗和建筑为原创环境配角。 |
| cn-18 | 春林嫩芽、溪水、白桦与残雪；明确只有春季，没有四季拼贴。四季交互需另用方法示意和正文证据。 |
| cn-19 | 海港、船、天际线与金紫荆示意；v2 已清掉渡轮字样和疑似符号。没有读得出的文字、标牌或水印；不是香港当前实景照片、景点地理复原。 |
| cn-21 | 鸟、溪流、叶枝与风中的草构成听声情境；无文字或音符。画出的鸟和瀑布不是声音识别或具体物种事实答案。 |
| cn-22 | 叶片、紫白花丛、前景蜻蜓、鸟与竹叶清晰，适合点选后口头观察；没有真正的巨大书本。园亭、石桥、鱼等为原创环境补充，不假称课文原句。 |
| cn-24 | 学习桌、少年、简单玻璃器具和未写字的书页；v2 清理书脊字样、地图字样与尺上刻度。无青蛙解剖、奖励或实验结果；不是童第周真实旧照或实验室复原。 |
| cn-25 | 平静医护帐篷中整理干净布料，远处柔和烟；无伤口、血、手术、武器或患者。v2 把容易误认中国人物的首稿医生改成加拿大医生原创示意；不是白求恩历史照片或已核肖像。 |
| cn-26 | 老木桌上的粗瓷大碗为主体；v2 移除背景带字墙纸，墙面恢复素色；无赠食行为、结局或博物馆标签。不是实物文物照片。 |

## cn-22 真实画面观察热点参考

坐标以原图左上角为 (0%, 0%)、右下角为 (100%, 100%)，仅对 1536 × 1024 整图显示有效。建议使用 `object-fit: contain`；若使用 cover 裁切或变更图窗比例，必须重算热点。以下是已见对象的参考中心，不是自动识别标注或教材词表证据。

| 可观察对象 | 参考中心 x / y | 适合引导 |
| --- | --- | --- |
| 近景小鸟 | 14% / 15% | 看身体、翅膀与停歇姿态；不要求猜物种 |
| 近景叶片 | 27% / 20% | 说叶形、颜色与枝叶关系 |
| 左侧紫白花丛 | 9% / 38% | 找颜色差别、花瓣与成丛的细节 |
| 前景蜻蜓 | 59% / 82% | 观察细长身体、翅膀与停歇位置 |
| 右上竹叶 | 90% / 14% | 比较叶片形状；不据图断言教材原句 |
| 中上棕榈 | 49% / 10% | 比较扇状叶形与近景小叶 |

蜻蜓、叶片与花丛在原尺寸可辨。实际小屏热区按钮应放在对象附近并保持可点击，不能遮住全部观察对象。正文教学先分清“图上我看见”与“课文写了什么”，不让儿童从画面新增配角推断教材事实。

## 程序核验结果

- 27 个 ID 无重复；发布目录正好 27 WebP，没有 PNG、重复的 `-v1.webp` 或无主资产。
- 全部 PNG 与 WebP 可解码，格式正确，实际尺寸 1536 × 1024，RGB，3:2。
- 27 最终 PNG 副本与生成器对应原件的 SHA-256 **全部相同**，原件复制未改变内容。
- 每个 final PNG / WebP 的字节数与记录一致；下文记录每张 final PNG / WebP 的 SHA-256，便于后续复查。
- `git check-ignore output/chinese-precision-images/cn-23-v1.png` 返回路径，确认 raw 目录被忽略。发布前应继续只将 WebP 与本 MD 纳入变更，不强制提交原 PNG。

## 首次生成的完整提示词

以下文本是对应首次生成实际发送的完整 prompt，没有省略公共风格段。每条都单独调用内置生成器。

### cn-23 · 司马光

用途：司马光原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-23.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-e57a75d9-7561-4813-ba2d-c7cc64eb636b.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-23-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-e57a75d9-7561-4813-ba2d-c7cc64eb636b.png`。最终 PNG SHA-256：`6c7e73ab09cf44d17f5d589835b2ea75e118ab3f58f76f032df329d569f0c42d`；最终 WebP SHA-256：`518e69973cb2072701240f4a3ca1dc63872cfd677f6b50ba6e5b653407ca06f2`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a quiet old Chinese courtyard with a large intact sturdy earthenware urn (瓮), partly filled with calm water, on the flat courtyard ground. Several children in simple traditional clothing are playing at a safe distance beside it; one curious child looks toward the urn but nobody is standing on it or inside. A low plaster wall and old wooden doorway, a few ordinary leaves on ground. Focus on the setting before the incident. No rockery, no artificial mountain, no stone platform, no drowning, no falling child, no splashing, no smashed urn, no rescue or flying stone. Gentle daylight, old brown pottery and soft green shade.
```

### wangdongting · 望洞庭

用途：望洞庭原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/wangdongting.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-c6a4dd2e-4d45-4705-98a3-a89432c76a35.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/wangdongting-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-c6a4dd2e-4d45-4705-98a3-a89432c76a35.png`。最终 PNG SHA-256：`e1835ea4da30c13b2a996c3d7f5bf47a6efa63c12af7a6c333231aa5c92d4bd0`；最终 WebP SHA-256：`4e736e84503a2b060cf9c3cdc90c9dfded5b73d19221b16f4cf54551a82f89c1`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene inspired by the ancient poem 望洞庭: the viewer stands far from a calm broad lake under a luminous moon. Soft silver moonlight blends with nearly rippleless blue-green water like a mirror. Far away a single small lush green island hill resembles a jade-green snail resting in a wide silver basin, but depict only the actual hill and lake: no literal basin, no actual snail. Expansive serene autumn night, subtle mist, fine reed silhouettes close to the viewer, small distant shoreline, long quiet horizon. No people, no lake monster.
```

### shanxing · 山行

用途：山行原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/shanxing.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-3701dfd8-8306-40f8-9110-92b7cc9e75af.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/shanxing-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-3701dfd8-8306-40f8-9110-92b7cc9e75af.png`。最终 PNG SHA-256：`5214608ef6d092d1f3f93eef03e5a4bfc16d1b9141cd69b16536f038e5ce0f29`；最终 WebP SHA-256：`82d4169edc65774e6213be775a701c5c1d1c8fbd2119d520289ea72895395446`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene inspired by the ancient poem 山行: a pale stone path winds upward into a cool autumn mountain. A few small white-walled rural houses nestle where soft white clouds rise. In the foreground middle ground a grove of rich crimson maple trees glows warmly in late-afternoon light; scattered scarlet leaves and rock textures are detailed. A small period-appropriate parked wooden carriage with a quiet distant traveler may sit unobtrusively near the bend, but the red foliage is the focus. Not a modern car; not spring flowers; no snow.
```

### yeshusuojian · 夜书所见

用途：夜书所见原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/yeshusuojian.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-5e462d18-d493-4ba3-b76f-a12baa4e3a5c.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/yeshusuojian-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-5e462d18-d493-4ba3-b76f-a12baa4e3a5c.png`。最终 PNG SHA-256：`5f08be99bb27871b7a65bdd026611e887cb6a9cea196d0dd27330d351f56caeb`；最终 WebP SHA-256：`c3676cd63897a84692bf00bc09eb4861ce93e3bdca7f3c0d2a8dcfcbcd44557c`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene inspired by the ancient poem 夜书所见: a quiet autumn night beside a river, tall wutong trees with wind-stirred broad leaves, sparse golden leaves carried gently near the ground. Across a low bamboo fence a tiny warm lamplight illuminates two small children looking for crickets in the grass, delicate and distant rather than the main close-up. A modest old riverside dwelling, deep ink-blue sky, subtle water sheen, evocative cool night air and thoughtful atmosphere. No giant cricket, no modern streetlamp, no fireworks, no speech bubbles.
```

### luchai · 鹿柴

用途：鹿柴原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/luchai.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-7a65c035-1083-4904-ae2b-b9e4ba88108b.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/luchai-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-7a65c035-1083-4904-ae2b-b9e4ba88108b.png`。最终 PNG SHA-256：`2c2b05e0716a9d70779c19178240234fa87e4d0bf729c830c93850bc275b34eb`；最终 WebP SHA-256：`ba625952417cfb7aaf34efa1605952e8f8a53fb69fc24ecb75806705f2b30e74`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene inspired by the ancient poem 鹿柴: an empty deep forest with tall trees, an open quiet pocket between trunks, a warm diagonal shaft of returning late-day sunlight reaching rich green moss on the forest floor. The forest is shaded and spacious, leaves finely painted, dappled ochre light amid deep olive. The poem title is a place name; absolutely NO deer, no animals, no visible people, no cabin, no written title. A visually quiet forest where distant unseen human voices could be imagined but are not depicted.
```

### wangtianmenshan · 望天门山

用途：望天门山原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/wangtianmenshan.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-8ef722bf-32f1-447f-980e-c2e7861cca6e.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/wangtianmenshan-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-8ef722bf-32f1-447f-980e-c2e7861cca6e.png`。最终 PNG SHA-256：`298bf8bb8b01124d9985dc75be0fccfe3a1087b4d3cd92d5d6dac5be769d7dd8`；最终 WebP SHA-256：`dc4d9d2b432a9b8993b358b3a5bed7a895b731a880672a3004024dd575684944`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene inspired by the ancient poem 望天门山: a mighty broad jade-green river passes between two steep dark green opposing mountain cliffs, opening a gateway in their silhouettes. View from a low position on the river, a small old single-sailed boat coming from the bright sunlit distance, current swirling gently around the mountain base. Vast warm sky reflected in water, mist softens far ridges, finely painted rocky faces and tree groups. Neither waterfall nor flooded village; no modern ships or bridges; no written scenery labels.
```

### yinhushang · 饮湖上初晴后雨

用途：饮湖上初晴后雨原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/yinhushang.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-87ccebc2-ae1b-455b-b083-3982d1a917eb.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/yinhushang-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-87ccebc2-ae1b-455b-b083-3982d1a917eb.png`。最终 PNG SHA-256：`ae0b448e782aae9dab5c43eb46d829e746fc7da88f3c46768e55b3b8ee88fe34`；最终 WebP SHA-256：`541c279794db690a93426711ecf5eb5f67669c6f79112e8076c13f0388feb27e`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene inspired by the ancient poem 饮湖上初晴后雨: one coherent broad West Lake landscape transitioning gently across the light from clear soft sun on the left to fine silver rain and mountain mist on the right. The same calm lake remains continuous, delicate willow branches at the near bank, distant rounded green hills and a small tasteful lakeside pavilion in the distance. Beauty comes from luminous water shimmer and hazy slopes, not a literal woman posing in the lake. No collage split line, no portrait of Xishi, no storm lightning, no signage.
```

### cn-01 · 大青树下的小学

用途：大青树下的小学原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-01.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-af87894f-617d-4e94-901d-3505f07087d2.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-01-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-af87894f-617d-4e94-901d-3505f07087d2.png`。最终 PNG SHA-256：`3a542ed55c0a690bab448ccbf09dc3ef8d6276ac96b7a2935a6c7047aefed74b`；最终 WebP SHA-256：`544eb9c1ea4830121712cf5327915d18e0a056b1f4ef176b8443fe23ecc14167`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a welcoming small primary school in a green southwestern Chinese mountain village, a large mature banyan-like green tree shading the courtyard, white walls, a simple old bronze bell, bamboo and distant soft hills. Several eight-year-old children in varied modest colorful clothing greet each other and walk toward the classroom with satchels, while a small bird rests in the tree. Natural lively school morning. Respectful varied children, not caricature costume stereotypes; no readable signs, school logo or banner; no giant flag filling frame.
```

### cn-02 · 花的学校

用途：花的学校原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-02.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-7f69329a-0124-4321-b771-de0c20182775.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-02-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-7f69329a-0124-4321-b771-de0c20182775.png`。最终 PNG SHA-256：`7cc888e9a23ca89b3f546875525ade7973a1b976184480fd1076f30fcb5c93b4`；最终 WebP SHA-256：`a822a6afbadf5298235de7a53b622a9c47c65c439cdff9eeeb8f7f20dea58130`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a beautiful natural flower garden during a fresh warm rain. Slim flowering stems in white, yellow and purple bend and lift with the breeze beside a bamboo grove, tiny droplets, moist earth and soft lively dark clouds. The flowers feel animated through their graceful posture and rhythmic composition, while staying botanical rather than literal human children. No underground school, no faces on flowers, no giant classroom, no future story scenes. Rich wet greens and fresh petal colors, inviting imaginative atmosphere.
```

### cn-03 · 不懂就要问

用途：不懂就要问原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-03.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-27651b66-5ae0-420a-a443-b973f79896c5.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-03-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-27651b66-5ae0-420a-a443-b973f79896c5.png`。最终 PNG SHA-256：`22dfe95a8ff33ebe6c3552138e6e6d528f5d1107c46e0b911b9c3280b3b7ff6b`；最终 WebP SHA-256：`3602ae48edc43989359ebdf552944f13fd6cea77eb2bdfb1879ba5b8f0e73710`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a small traditional Chinese private-school room in the late nineteenth century, old wooden desks and open books with wholly blank or indistinct pages. A young boy stands politely beside his desk and raises a hand, thoughtful and earnest. Nearby seated pupils watch with quiet curiosity, an older teacher in plain long clothing listens near a simple desk. Soft light through lattice windows, muted ink-blue and brown, finely painted wood. Original historical-inspired interpretation, not a portrait likeness. No punishment, no hitting, no threatening ruler, no scene of the eventual successful explanation.
```

### cn-05 · 铺满金色巴掌的水泥道

用途：铺满金色巴掌的水泥道原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-05.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-16ba927c-f6f3-407c-a680-e381fc392348.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-05-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-16ba927c-f6f3-407c-a680-e381fc392348.png`。最终 PNG SHA-256：`afb1472f417ae527feba7556503d45b3f3baa246ab0e61eedbc28c184b85372a`；最终 WebP SHA-256：`0b71eb9278762baedf90e14acbd553a02ec5c42512a5dd57b5f24923d5085b6e`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a damp pale concrete footpath after an autumn rain, covered in broad golden wutong or plane-tree leaves shaped like small open palms. Close foreground leaves reveal lobes, veins and tiny droplets; the path recedes elegantly beneath tall autumn trees. Puddles reflect patches of soft blue sky, warm sunlight falls between shadows. No literal human hands substituted for leaves, no person required, no words on pavement. Highly tactile natural observation, ochre gold and warm gray.
```

### cn-06 · 秋天的雨

用途：秋天的雨原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-06.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-84eeec80-91d6-47bb-bfea-516780c81f38.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-06-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-84eeec80-91d6-47bb-bfea-516780c81f38.png`。最终 PNG SHA-256：`ac5d6f4806b12ee2a59dce798f89c99eac094c64cb373ad98e7b2f3339ef6b4d`；最终 WebP SHA-256：`8f8901934aa17fda877407c059f1f7cfa29b1ba792283e9c3e2e59276db8d713`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a gentle autumn rain passing over a lively rural landscape. Golden ginkgo foliage, crimson maple foliage and warm ripe orchard fruits in the middle distance, yellow-brown meadow and a small path with fine rain threads and glistening droplets. One coherent scene showing color, seasonal freshness and calm preparation for cold weather, not a three-panel infographic. No humanized weather, no giant key, no speech bubbles or educational labels. Muted watercolor sky, rich natural autumn colors.
```

### cn-07 · 听听，秋的声音

用途：听听，秋的声音原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-07.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-1f90dc45-9ca2-4e9e-936b-459190d097fd.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-07-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-1f90dc45-9ca2-4e9e-936b-459190d097fd.png`。最终 PNG SHA-256：`50db09aed01e882d37710366a277c8ac8ace465c00066809ab76c1c54b84c2ab`；最终 WebP SHA-256：`8e3f28519c59e99107d0b92303665c679fa4ca822b61574de2a0a2e2e9ca00b8`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a breezy autumn woodland clearing, several dry yellow leaves rustling above the ground, a small cricket resting by grass at the lower edge, a distant line of migrating wild geese in the broad sky. Tall tree trunks and grain heads suggest seasonal rhythm. Sounds are conveyed by wind-stirred natural shapes only, with no music notes, onomatopoeia or printed sound effects. Fine gentle earthy detail, a sense of listening carefully rather than a cartoon concert.
```

### cn-09 · 犟龟

用途：犟龟原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-09.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-2e015b05-e6b0-413a-8f5f-bd96541046bf.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-09-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-2e015b05-e6b0-413a-8f5f-bd96541046bf.png`。最终 PNG SHA-256：`3f49719b389e168c6f1e100765b9e7acd2888e3aa497d7a62582ea8803d0ba36`；最终 WebP SHA-256：`25de84316a1c9e395532b298e8d5bbba3598f5b61fa721110681137134aea04f`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: one small determined tortoise begins a solitary journey along a gently curving woodland path toward a distant warm sunrise. Its natural shell texture and small feet are visible; a fork further down the path and tall grasses suggest possibilities. Quiet spacious woodland, finely painted moss, soft autumn colors. Only the tortoise: no other animals, no spider, no snail, no lizard, no lion, no wedding, no crown, no party, no destination palace, and no ending scene. No signposts or road labels.
```

### cn-10 · 小狗学叫

用途：小狗学叫原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-10.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-ca84b067-d7b5-4fa3-bf8e-8222e2eb29d9.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-10-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-ca84b067-d7b5-4fa3-bf8e-8222e2eb29d9.png`。最终 PNG SHA-256：`4bf03c31a4f13eea84cb9f578f2451877f0029397d8186109a55588cde392933`；最终 WebP SHA-256：`c46c97e47e93f70da0669f77c7317b985c41d77a50bef079333ea709761afe8f`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: one small friendly puppy stands thoughtfully at a fork in a rural path, looking between two quiet woodland trails. Natural brown-white coat, alert ears, gentle expression, meadow flowers and tall grass near its paws, warm open sky. Beginning of an uncertain journey, not an outcome. Only the puppy: no rooster, no cuckoo, no fox, no hunter, no gun, no teacher animal, no comic sound effects or visible future scene.
```

### cn-11 · 宝葫芦的秘密（节选）

用途：宝葫芦的秘密（节选）原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-11.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-fbf8b8d7-7fc7-4b0c-bac0-da6989955baa.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-11-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-fbf8b8d7-7fc7-4b0c-bac0-da6989955baa.png`。最终 PNG SHA-256：`fa457b68369793460e32130749be35d035f0e8726ad2ec1f346e659a09d5b316`；最终 WebP SHA-256：`4a38fc391d7b775e020ea6bef3d3b29424fd355c085c97676827feb6c01bfe17`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a warm modest Chinese family home where a grandmother sits on a wooden stool telling a story to her curious eight-year-old grandson. The boy leans forward listening, hands resting quietly beside an open blank notebook; soft window light, a simple cup and household wood textures. A subtle visual sense of imagination through gentle warm light, but no thought bubble containing outcomes. No actual magic gourd, no gourd in the boy hands, no treasure, no supernatural gifts, no later adventure or ending.
```

### cn-12 · 在牛肚子里旅行

用途：在牛肚子里旅行原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-12.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-77121b2f-d252-4b1c-b8d4-3df2c8261f2d.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-12-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-77121b2f-d252-4b1c-b8d4-3df2c8261f2d.png`。最终 PNG SHA-256：`924589a5d74b712aeb4109625c7a47a74121afe4d21ce5ed50cb8aabdb1cb75f`；最终 WebP SHA-256：`a5d109b34dae220e7d7a94e4c5120ba5cf1de745b10f0604988ae9ce87265ca3`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: in a sunny meadow beside a calm grazing brown cow, two clearly recognizable small crickets perch on nearby grass stems in the close foreground. Their slender legs and antennae are observed carefully, the cow is farther away for readable scale. Soft green pasture and an ordinary quiet rural setting before any mishap. No cricket inside the mouth, no swallowing, no exposed internal organs, no digestive cutaway, no rescue or sneeze, no labels.
```

### cn-13 · 一块奶酪

用途：一块奶酪原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-13.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-dcb8a578-e91c-4eb8-a37d-fe839df953fa.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-13-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-dcb8a578-e91c-4eb8-a37d-fe839df953fa.png`。最终 PNG SHA-256：`750e895033f4a282a81212c53c706219b65d4459c772cda712e9c957df9279c1`；最终 WebP SHA-256：`280bf9e3ee1b8262b8a2142923f6a3e893fa197f6ee4494586e53d4f8ed4febc`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a small group of ants cooperatively carrying a pale cream piece of cheese through the forest floor, rich macro detail in moss, fallen leaves and twigs. One slightly larger ant is nearby guiding the group in an ordinary way, without clothes, badges or human face. Focus on the cooperative transport before the dilemma; cheese remains intact. No dropped crumbs, no stealing, no ant eating, no distributing to the smallest ant, no final resolution.
```

### cn-16 · 富饶的西沙群岛

用途：富饶的西沙群岛原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-16.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-dc44b135-d6b3-4760-a78c-679ca40c5eac.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-16-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-dc44b135-d6b3-4760-a78c-679ca40c5eac.png`。最终 PNG SHA-256：`a59a5ad6acc7bb44635c1307f7bb0bf2c29e05f9dbc7c61beeced35dbf662d38`；最终 WebP SHA-256：`96af838171fe1821beb197e2bc9ddb49d588061cbe1807791609057261b81407`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a luminous tropical coral-sea observation landscape inspired by 西沙群岛, original illustration not an actual travel photograph. A coherent waterline composition shows shallow clear turquoise water, lively small fish, layered colorful corals and a tiny lush island farther back with palms and white sand; natural scale and visible sunlight shafts. Marine diversity readable with fine details, no fantasy fish, no treasure chest, no map borders, no flags, no captions. Gentle emerald, azure and coral colors.
```

### cn-17 · 海滨小城

用途：海滨小城原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-17.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-34cb9fa2-fd70-436a-bb4a-d27f39d23c29.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-17-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-34cb9fa2-fd70-436a-bb4a-d27f39d23c29.png`。最终 PNG SHA-256：`ecdbad6639b56d9a8e90ffe2aa1e431ce980f59fa459471ebaeb43b3a180c157`；最终 WebP SHA-256：`519476f1395f2a7230de71c6948c270213886d2a681d0b765b6af5325479b398`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a warm quiet Chinese seaside small town, viewed from a winding pedestrian lane toward the blue sea. Distant fishing boats, airy white houses, a leafy courtyard and a few old broad trees along the street, fine stone pavement textures and soft sea breeze. A cohesive lived-in place with clear near-to-far landmarks, not a tourist map or poster, no shops with writing, no readable signs, no giant lighthouse invented as focus.
```

### cn-18 · 美丽的小兴安岭

用途：美丽的小兴安岭原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-18.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-913a61df-3933-4964-98e0-2349326f70ac.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-18-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-913a61df-3933-4964-98e0-2349326f70ac.png`。最终 PNG SHA-256：`99af2dbb60f4dbca16604f69a9d49c717e86812b228ab3f479f8276b3b7042da`；最终 WebP SHA-256：`2a7a4a93dd6826a019980aa26e35251a064e6063495ad420debe65cf5a96f437`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a lush early-spring northern forest inspired by 小兴安岭, one spring overview only. Slender birch trunks and tall evergreen trees, fresh pale green buds, a gentle stream with small remaining snow patches on its shaded banks, distant wooded hills and soft spring light. Natural detailed moss and branches. No four-season collage, no autumn red leaves or midsummer fruit, no season labels, no invented animals as central subject.
```

### cn-19 · 香港，璀璨的明珠

用途：香港，璀璨的明珠原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-19.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-268441fb-e96d-41fd-ba5a-818ac47f0969.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-19-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-56e76555-bcc3-4004-bbcd-071b7a3ec18f.png`。最终 PNG SHA-256：`cb8a201e238265e60d8779a1cbd4bbae72cfda220884da9f633d3af5d5d83b62`；最终 WebP SHA-256：`ccc9b6102d574efaee941ccc6ca1d29e02297ad6f0ff7cbcf8bcc448ff9ae88e`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: an original literary panorama of Hong Kong harbor, viewed from a calm accessible waterside foreground with green trees. Warm natural daylight, a distant layered skyline on both shores, mountains behind, a small harbor ferry on the blue-green water and a graceful golden bauhinia-shaped public sculpture understated in the near distance. Painterly age-appropriate city scene, not a current real photograph or advertisement. No readable skyscraper signs, names, numbers, logo or political slogan; no fireworks.
```

### cn-21 · 大自然的声音

用途：大自然的声音原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-21.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-ee3315d1-faf1-49be-9385-c3e1dcdd4107.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-21-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-ee3315d1-faf1-49be-9385-c3e1dcdd4107.png`。最终 PNG SHA-256：`931802084cbece0789569f38db10e7de7bea7d2543ebf9e943511c1ab98eec94`；最终 WebP SHA-256：`e5df146ef20c83f785311ecfa36b8184b3fc495e7cb0c7d630e2445e72b9f946`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a peaceful natural sound landscape, foreground clear stream moving over small stones, reed leaves trembling in a breeze, tall trees with birds resting quietly farther away, forest and distant flowing water. The stream visually leads into the distance, finely painted ripples and leaf texture. One coherent scene evoking wind, water and birds; no diagram levels, no music notes, no written sound effects, no stage or instruments.
```

### cn-22 · 读不完的大书

用途：读不完的大书原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-22.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-87c5d54c-c168-4c38-942f-10cbb1d1f79e.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-22-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-87c5d54c-c168-4c38-942f-10cbb1d1f79e.png`。最终 PNG SHA-256：`0e5fcd0e4c52fb09edf594917fe80bd37c565beb98ab65e48c43c25833cb5f43`；最终 WebP SHA-256：`00479b40bfca1f87aae440f9f183c5d3c139b9a71d15cbaf7c4654d65ae81d42`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a rich but calm Chinese garden edge observed as if it were an open natural world: close moss and wildflowers, small sparrows on a branch, a dragonfly near grass, graceful bamboo leaves and a palm silhouette reflected in a small pond. Every object has natural scale and readable detail, soft warm afternoon light. No literal gigantic book, no text on leaves, no fantasy animals, no person posing; attention to varied observable details.
```

### cn-24 · 一定要争气

用途：一定要争气原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-24.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-4e32ecdd-f9f4-4dab-8214-6950cc3a8886.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-24-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-ca4c2a88-81da-4db3-b6ef-abd4400fed4b.png`。最终 PNG SHA-256：`bcac678b8fc6911e277629ad212446a9d2a09f86e3712260332562bf16560cb9`；最终 WebP SHA-256：`3d392eb29913bf33f7d3bf1f26196753c75e7784d34ac70d2697fca777b51b46`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: original historical-inspired literary illustration of a young Chinese scholar studying carefully at a wooden desk in the early twentieth century. A soft reading lamp lights blank indistinct notebook pages, a ruler and simple glass laboratory vessels rest neatly to one side, face thoughtful and focused, background modest window and book shelves with wholly unlettered spines. This is an interpretive study/experiment atmosphere, never an alleged photograph or verified exact historical room. No visible frog surgery or anatomy, no boastful award, no foreign-student confrontation or completed experiment outcome.
```

### cn-25 · 手术台就是阵地

用途：手术台就是阵地原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-25.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-846bdd57-c824-4845-8bfa-f65820635757.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-25-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-7054f459-6720-487e-9a64-6ae42ca144c4.png`。最终 PNG SHA-256：`7d889ffaafe02c7d418442684ebe3d5000738e5c3986aef8cefb06c6da3e5c2f`；最终 WebP SHA-256：`b35dd08141fbc9dd5b8ef1c3d509894eaf58675b97788146c567d1e9b3b979e4`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a quiet field medical tent inspired by a historical wartime story, original age-appropriate gouache illustration. A compassionate doctor in plain old-fashioned medical clothing and a nurse arrange folded linens, a clean lamp and simple closed medical kit on a wooden worktable. Gentle diffuse tent light, faint gray smoke far beyond the entrance suggests a difficult environment without a battle spectacle. No wounded patient, blood, operation, exposed body, needles close-up, explosion, weapons, gore, flags, numbers or writing.
```

### cn-26 · 一个粗瓷大碗

用途：一个粗瓷大碗原创文学总览。最终文件：`H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-26.webp`。

首稿生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-3070ca45-dfa3-4ccc-a1ab-70ec77cc94e7.png`。首稿本地副本：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-26-v1.png`。

最终使用原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-59a2435e-3ca6-4f8f-83de-92795090a2e5.png`。最终 PNG SHA-256：`466cace4ff2c9a01a282dda2159655f7bcd4739d9c66c48c5368a8e55928e8d6`；最终 WebP SHA-256：`ccd3bc3e03a5c233e49229ec663572222e5cd245e46a4bab025d2e14a6f611d0`。

```text
Use case: illustration-story. Asset type: a dedicated overview illustration for a polished Chinese third-grade literature lesson. Create a full-bleed landscape 3:2 banner, 1536 by 1024 visual proportion. Premium painterly gouache and translucent Chinese ink washes on luminous warm paper, finely observed natural details, expressive literary picture-book illustration for age eight to nine. Natural proportions, coherent perspective, elegant readable silhouettes, rich atmospheric depth, gentle realistic colors. Not preschool clip art, not vector, not a collage, not a poster. All major subjects fully within the frame, balanced composition, no excessive empty sky. Original interpretation, never a copy of textbook artwork or a historical photograph. Absolutely no writing, lettering, labels, calligraphy, captions, numbers, signs, logos, watermarks, visible readable book pages, or UI. Scene: a humble old wooden table inside a modest historical field dwelling, one broad rough earthenware bowl centered in a beam of warm window light. The bowl has a matte light-gray glaze, uneven handmade rim, subtle coarse pottery texture and small wear marks. Simple wooden bench and indistinct cloth nearby, quiet restrained atmosphere of everyday life. No sumptuous feast, no exchanging food, no giving the bowl away, no museum labels or writing; the object itself is the story opening.
```

## 定向修复记录与完整提示词

首稿被发现的四处问题均用内置 imagegen 编辑后解决，未用 Pillow 去字或改变人物。编辑参考图为本地 v1 PNG；保留 v1 供审计，canonical WebP 已替换为相应 v2 的格式编码。所有 4 张 v2 输出及其最终 WebP 都实际查看过。

| ID | 首稿问题 | 最终修复 |
| --- | --- | --- |
| cn-19 | 渡轮侧面有疑似字样和重复符号 | 船体改为素色面板及暗玻璃，不留名称、编号或字样 |
| cn-24 | 后方书脊有类似文字，尺和球面容易带标记 | 书脊改为无字色带，页、球面与尺移除字样/数字；保留文学学习示意 |
| cn-25 | 首稿医生外貌容易被误认中国人物 | 改为加拿大医生原创示意；不声称白求恩真实摄影肖像 |
| cn-26 | 左上墙纸出现类似书法文字 | 移除整张带字墙纸，替换为同色素墙；保留粗瓷碗主体 |

### cn-19 · v2 定向修复

参数：`referenced_image_paths = ["H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-19-v1.png"]`，`transparent_background = false`。

修复生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-56e76555-bcc3-4004-bbcd-071b7a3ec18f.png`。修复本地原 PNG：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-19-v2.png`。发布文件仍为 canonical `H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-19.webp`。

```text
Edit this original painterly Chinese third-grade literature overview illustration for 香港，璀璨的明珠. Preserve the landscape 3:2 composition, fine gouache paper texture, harbor, children, ferry, warm light, skyline and golden bauhinia sculpture. Remove every trace of lettering, pseudo-writing, numerical symbols or logo anywhere in the entire image, especially the ferry side and window panels. The ferry must have completely plain clean ivory and dark-green painted body, dark glass windows and natural painted edges only. No boat name, no repeated symbols, no registration numbers, no signage, no logos, no readable text. Remove only such markings and keep an elegant original storybook illustration, never a historical or geographical photograph.
```

### cn-24 · v2 定向修复

参数：`referenced_image_paths = ["H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-24-v1.png"]`，`transparent_background = false`。

修复生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-ca4c2a88-81da-4db3-b6ef-abd4400fed4b.png`。修复本地原 PNG：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-24-v2.png`。发布文件仍为 canonical `H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-24.webp`。

```text
Edit this original painterly Chinese third-grade literature overview illustration for 一定要争气. Preserve the boy studying at the wooden desk, the warm window light, picture-book gouache and ink texture, simple scientific glassware, plants, composition and 3:2 aspect ratio. Remove ALL writing, calligraphy, pseudo-writing, letters, numbers, labels and scales from the entire image: every book spine must be plain unlettered cloth or paper with simple blank decorative color bands only; all book covers and pages must be plain unlettered paper; the globe must have only faint geographic shapes and absolutely no names or lettering; the ruler must have no numerals or graduation marks. Remove any wall inscriptions. This is only an original literature scene, not a historically verified photograph or a facsimile of a real room. Do not add awards, frog dissections, results or any claim of historical accuracy.
```

### cn-25 · v2 定向修复

参数：`referenced_image_paths = ["H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-25-v1.png"]`，`transparent_background = false`。

修复生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-7054f459-6720-487e-9a64-6ae42ca144c4.png`。修复本地原 PNG：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-25-v2.png`。发布文件仍为 canonical `H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-25.webp`。

```text
Edit this original painterly Chinese third-grade literature overview illustration for 手术台就是阵地. Preserve the peaceful field medical tent, the nurse, their safe preparation of folded clean linens, soft distant smoke, empty beds, doctor bag, warm light, fine gouache and Chinese ink paper texture, natural proportions, and 3:2 landscape framing. Change the male physician to a middle-aged white European Canadian man with modest short light brown hair, slightly receding hairline, a thoughtful calm face and thin round spectacles, wearing the same plain white medical coat and preparing linens. The figure is an original story interpretation of a Canadian physician, not a photographic likeness or verified historical portrait. Do not add wounds, blood, surgery, injured bodies, weapons, combat, labels, words, numbers, signs, medical emblems or logos. All jar surfaces and equipment remain unlettered.
```

### cn-26 · v2 定向修复

参数：`referenced_image_paths = ["H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-26-v1.png"]`，`transparent_background = false`。

修复生成器原件：`C:/Users/lenovo/.codex/generated_images/01a106cd-92af-7233-9427-f859585cc2de/exec-59a2435e-3ca6-4f8f-83de-92795090a2e5.png`。修复本地原 PNG：`H:/AI-Project/教材/word-adventure/output/chinese-precision-images/cn-26-v2.png`。发布文件仍为 canonical `H:/AI-Project/教材/word-adventure/public/images/chinese-precision/cn-26.webp`。

```text
Edit this original painterly Chinese third-grade literature overview illustration for 一个粗瓷大碗. Preserve the close view of the rough plain grey ceramic bowl on an old worn wooden table, the quiet simple rural historical interior, sunlight, warm palette, fine gouache paper texture, 3:2 landscape composition. Remove the framed sheet with writing at the upper left of the wall entirely and replace that area with the same plain aged plaster wall, natural cracks and gentle light only. Remove ANY letters, calligraphy, pseudo-writing, numbers, labels, logos or markings from anywhere in the image. Keep the bowl large, plain and visibly rough; no museum label, no decorated luxury bowl, no food exchange, no human action or story resolution. This is original storybook still life, not a historical photograph.
```

## 最终验收边界

本批 27 图已满足独立场景、文学绘本质感、3:2 原尺寸、不以结局剧透作开篇、可读文字清理和高质量 WebP 发布资产要求，文件与记录冻结。画像不替代教材内容核验；现有纸质正文、必背要求、字词表和园地栏目仍按全册计划逐项核对。网页实际布局、热点裁切与发布状态由整合验收另行记录。
