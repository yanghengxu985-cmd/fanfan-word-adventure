# 英语情境活动音频

Unit 1、Unit 2 的短提示、回答示范和完整对话使用家长已经选定的英式女声 `en-GB-SoniaNeural`。速度在合成阶段固定为 `-12%`，播放速率保持正常；不新增其他角色声线。

当前包含 52 个片段 ID、52 个独立 MP3，总大小 1,789,424 字节（约 1.707 MiB）。单段时长 0.816–5.472 秒，总时长 110.448 秒；同一女声会顺次读出完整对话中的两轮台词。既有 Unit 1、Unit 2 的 48 个片段保持原样，独立的三样例体验课只追加下面 4 段录音。

| 新片段 ID | 完整合成台词 | 时长（秒） |
| --- | --- | --- |
| `lab-guide` | Listen. Look. Choose. You can listen again. | 4.992 |
| `lab-listen-choose` | Listen and choose. | 1.800 |
| `lab-my-name` | My name. | 1.224 |
| `lab-your-name` | Your name. | 1.224 |

这 4 段共 149,552 字节、9.240 秒。体验课其余示范与问候复用现有录音；本次没有重新合成旧片段。追加生成后已对比原有 48 个活动 MP3 和 148 个词卡 MP3 的 SHA-256，确认文件内容未改变。

## 内容与边界

录音的唯一文本来源是 `src/data/englishActivityClips.json`，格式为活动片段 ID 到英文文本的映射。活动文案是游戏中的提示或原创示范，不冒充教材原声或教材课文的完整朗读。生成器只处理这份文本源，不修改已有的 153 条词汇/字母发音清单。

`Mr` 和 `Mr.` 在合成输入中展开为 `Mister`，显示文本保留原样。输入不含中文提示、星号、括号说明或需朗读的角色标签。同一段英文台词只生成一个文件，可以服务多个活动片段。完全相同且声音、速度一致的既有词汇录音可以复制复用；其原始文件与清单不会改变。

音频来源是 Microsoft Edge 在线神经 TTS，通过 `edge-tts 7.2.8` 制作。它是 AI 练习语音，不是真人或教材配套录音，也不需要 Azure Speech API 订阅。在线合成仅用于制作资源；网站从自己的静态资源地址播放 MP3，不在儿童使用过程中发起在线 TTS 请求，不需要提供 API 密钥。

## 资源与核验

- `public/audio/english-activities/`：活动专用 MP3 和完整 `manifest.json`。
- `src/data/englishActivityAudioManifest.json`：前端编译清单，与公开清单的 `schemaVersion`、`voice`、`rate`、`locale`、`entries` 五个字段完全一致。
- 每条 `entries[clipId]` 保存 `id`、相对路径 `file`、显示文本 `text`、合成输入 `spokenText`、时长 `durationSeconds` 和大小 `bytes`。
- 公开清单的 `files` 还保存每个 MP3 的 SHA-256、采样率、峰值和 RMS，便于本地或发布后的完整性检查。

文件名由声音、速度、合成输入和处理版本的 SHA-256 前 24 位生成。网站播放器应在清单的相对路径前加 Vite `BASE_URL`，兼容 GitHub Pages 仓库子目录。两份清单由同一脚本生成，不手工维护。

音频使用与现有英语发音相同的处理设置：单声道 24 kHz、128 kbps MP3，以及 `loudnorm=I=-18:TP=-2:LRA=7`。只压缩两端过长静音，不裁切对话句间停顿；活动阈值为 -54 dBFS，两端各保留最多 150 ms 和 250 ms 的原有空白，保护较轻的辅音。

## 生成与离线检查

使用 Python 3.10 或更高版本和既有音频依赖：

```powershell
python -m venv output/audio-build-env
output/audio-build-env/Scripts/python.exe -m pip install -r scripts/requirements-audio.txt
output/audio-build-env/Scripts/python.exe scripts/generate_english_activity_audio.py
output/audio-build-env/Scripts/python.exe scripts/generate_english_activity_audio.py --verify-only
```

生成时最多并发 3 个请求，每段最多重试 3 次；`--concurrency 1` 可以降低并发。原始合成片段和中间 WAV 保存在被 Git 忽略的 `output/english-activity-audio-build/`。已生成并核验通过的资源不会重复请求。两份清单在全部资源成功后写出；脚本不提交代码或发布网站。

`--verify-only` 不调用在线语音服务。它检查两份清单一致、文本源 ID 精确覆盖、显示文本和合成输入正确、所有文件 SHA/大小/时长一致、全部音频可以完整解码、音量合理，以及不存在未引用的 MP3。

技术核验不能代替教师对每段发音和对话语调的审听。课堂或亲子使用时应检查“听提示”“听示范”“完整对话”等播放按钮，确认每次点击使用对应片段、连续点击会停止上一段、页面切换后停止播放、失败时能明确重试。
