# 英语固定发音资源

家长试听后选定了 A 的英式女声和 B 的慢读速度。全部资源使用 `en-GB-SoniaNeural`，在合成阶段设置 `rate=-12%`；播放时保持正常速率。不是把正常录音降速播放。

## 范围与来源

- 对应现有游戏的 153 个可发音英语记录：127 个单元词/表达和 26 组大小写字母。
- 共 148 个独立 MP3。`class`、`it`、`for`、`love` 在不同单元复用；词汇 `I` 和字母 `Ii` 也复用相同输入。
- 来源为 Microsoft Edge 在线神经语音，通过 `edge-tts 7.2.8` 合成。这些是 AI 练习语音，不是真人录音、教材配套录音，也没有调用 Azure Speech API。
- 合成服务仅在制作资源时使用。网站播放同源静态 MP3，不需要用户提供 API 密钥或安装系统声音。
- 合成使用现有编辑审查后的词形。技术检查能确认文件存在、能解码、音量正常，不能替代教师对所有音素、重音和语调的逐条审听。
- 不把缩略形式表、专名表、教材别名或中文例句增加为当前词汇任务。教材印次仍沿用现有库存核对状态。

## 朗读规则

以 `src/data/inventory.json` 的英语记录为准，单词和常用表达使用 `text` 原样。特殊规则如下：

| 显示内容 | 合成输入 | 原因 |
| --- | --- | --- |
| `Mr` | `Mister` | 读称谓的完整发音，不读缩写字母 |
| `Aa` 至 `Vv`、`Xx`、`Yy` | 单个大写字母，例如 `A`、`B`、`I` | 读字母名称一次，不连读大小写形式 |
| `Ww` | `double you` | 明确字母 W 的名称 |
| `Zz` | `zed` | 固定英式 Z 的名称 |

`mum`、`grandfather`、`grandmother`、`child` 只读当前显示词形；`mom`、`grandpa`、`grandma`、`children` 等别名不会在一次播放中额外读出。所有输入拒绝中文、星号和括号说明。

## 文件与清单

资源位于 `public/audio/english/`。`manifest.json` 为每个英语 lexeme ID 记录文件路径、显示内容、实际合成输入、时长和大小。文件名由声音、速度、合成输入及处理版本的 SHA-256 前 24 位产生，相同输入共享同一文件。

完整的 `public/audio/english/manifest.json` 用于资源及全文件校验；`src/data/englishAudioManifest.json` 是其用于前端编译的精简副本，只包含 `schemaVersion`、`voice`、`rate`、`locale`、`entries`。播放器点击时同步查表，避免把公开资源目录当成 JavaScript 模块导入。两份清单由同一个生成脚本写出，不应手工修改；离线核验会检查这五个字段完全一致。

清单中的 `file` 是相对网站根目录的 `audio/english/<hash>.mp3`。应用需附加 Vite 的 `BASE_URL`，使 GitHub Pages 的仓库子目录地址也能播放。资源路径不应指向外部语音服务。

清单同时记录每个独立文件的完整 SHA-256、采样率、峰值和 RMS 音量。音频是单声道 24 kHz、128 kbps MP3，使用与 B 试听版相同的 `loudnorm=I=-18:TP=-2:LRA=7` 设置。为保留较轻的辅音，在 -54 dBFS 活动阈值两侧分别保留最多 150 ms 和 250 ms 的原有停顿；不会在每个词后加入试听比较用的长空白。

## 重新生成与离线核验

需要 Python 3.10 或更高版本。建议创建项目内虚拟环境；依赖安装会提供 ffmpeg 可执行文件，不需要另装系统 ffmpeg。

```powershell
python -m venv output/audio-build-env
output/audio-build-env/Scripts/python.exe -m pip install -r scripts/requirements-audio.txt
output/audio-build-env/Scripts/python.exe scripts/generate_english_audio.py
```

重新合成需要访问在线语音服务，最多同时发起 3 个请求，每个请求最多重试 3 次；可用 `--concurrency 1` 降低并发。声音与速度固定在脚本中，修改后必须重新审听。

```powershell
output/audio-build-env/Scripts/python.exe scripts/generate_english_audio.py --verify-only
```

`--verify-only` 不请求在线合成服务，会完整解码每个已提交的文件，检查两份清单一致、库存 ID 精确覆盖、输入与文件名一致、哈希与元数据一致、时长和音量合理，以及没有缺失或未引用的 MP3。

原始片段、处理中间文件缓存在被 Git 忽略的 `output/english-audio-build/`。脚本也可复用同声线和同速度的有效试听片段。资源存在且核验通过时不会重新合成；清单在全部生成成功后才原子替换。该脚本不提交代码、不上传文件、不发布网站。

## 验收边界

发布前检查第一单元词卡、常用表达、字母 A/W/Z 和称谓 Mr，确认手机与桌面均能点击播放、连续点击能停止上一段、页面切换会停止播放。任何播放失败应给出明确的重试反馈。这里的覆盖数仅描述发音资源，不代表完成了字词掌握、自然拼读训练或机器口语评分。
