# 第 7 课声部修复

原播放器把蟋蟀和大雁当作调频正弦波，把树叶当作过滤噪声。声音不能可靠帮助孩子辨认实际声源。本次仅替换《听听，秋的声音》的三个声部，不修改讲解、字词朗读或其他课程。

三个有来源的真实录音随站点一起托管，总体积见 `AUTUMN_NATURE_AUDIO_VERIFICATION.json`。署名、许可、来源和处理记录见 `public/audio/nature/ATTRIBUTION.md` 及本课“资料与指导”。

操作保留一个试听按钮及三条音量滑杆。播放时点声部名称可静音或打开；全部静音时显示明确提示。加载状态可取消，超过 20 秒转入可重试的失败状态，取消后的旧请求不会自动重启音频。Safari 的 AudioContext 解锁在点击同步调用中完成。换课、换标签、打开资料、教师停止、页面隐藏或离开时停止全部声部。

录音保持原速和自然叫声间隔，循环只在边界短淡化。响度调整与峰值约束让叶声可听、动物声不过载。声部轻重不是实测分贝；“告别、歌唱、叮咛”仍是诗人的想象。

## 重建和核验

使用已安装 `scripts/requirements-audio.txt` 的 Python：

```text
python scripts/build-autumn-nature-audio.py
python scripts/build-autumn-nature-audio.py --verify-only
npm test
npm run build
```

原音下载缓存位于忽略的 `output/audio-sources/`，交付只有三个 MP3 与来源说明。文件测试核对本地资源、不同声源、署名、体积和 PCM 验证结果的哈希；播放器测试涵盖取消、超时、失败重试、共享缓存、同步解锁与平滑音量。

自动 PCM/浏览器检查可确认文件可解码、有声音且控制正确，不能替代人的听感评价。本次声源身份以原作者及来源记录为依据，试听自然感仍需使用者实际确认。
