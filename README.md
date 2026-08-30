# VReply

把带字幕的 YouTube 视频转换为逐句精听与影子跟读练习。

VReply 是一款本地运行的英语、西班牙语学习工具。粘贴视频链接后，可以跟随字幕精听、循环单句、录制跟读、查词和复习。基础功能无需账号、前端构建工具或第三方 Python 包。

## 最新进展

当前版本为 `v2.6.5`。README 已同步以下已实现功能：

- **影子跟读**：支持“听一句，读一句”“文本辅助”“延迟跟读”和“无字幕挑战”四种训练方式；可选择麦克风、录制自己的声音，并与原音对照。
- **练习反馈**：在浏览器能力允许时，提供内容完整度、流利度、节奏相似度、语速、停顿和词错误率等参考指标。评分基于浏览器语音识别与时间对齐，不等同于专业发音测评。
- **主题与响应式界面**：新增“静夜”“晴昼”和“跟随系统”主题；练习区、设置、内容简介、生词本与窄屏布局均已适配两套配色。
- **学习状态恢复**：刷新或重新打开页面后，自动恢复上次的视频、学习语言与播放进度；学习时长、生词、字幕样式和练习偏好保存在本地浏览器中。
- **字幕体验优化**：字幕高亮跟随当前发音位置，并保留点句跳转、搜索、导出、自动跟随和单句循环。

## 界面预览

### 整体倾听

视频、当前句和逐句字幕保持在同一练习区，可随时切换双语字幕、搜索、循环和播放速度。

![VReply 晴昼主题的整体倾听界面](assets/vreply-listening-preview.jpg)

### 影子跟读

从整体倾听切换到影子跟读后，可按当前字幕播放原句、录音并逐句练习。

![VReply 晴昼主题的影子跟读界面](assets/vreply-shadowing-preview.jpg)

## 功能

- 英语与西班牙语学习模式
- 字幕同步、逐词高亮、点句跳转、上下句切换与单句循环
- 0.5×–3.0× 倍速、音量调节与字幕自动跟随
- 整体倾听与四种影子跟读训练方式
- 浏览器端录音、原音/录音对照与跟读反馈
- 字幕搜索、文本导出、单词收藏与学习时长记录
- 英语本地词典与英/美发音；西班牙/墨西哥发音
- Chrome 本地翻译或自定义模型 API 双语字幕
- 可选 AI 能力：语境查词、句子分析、字幕翻译、内容简介
- 静夜、晴昼与跟随系统主题

## 快速开始

要求：Python 3.10+、可访问 YouTube 的现代桌面浏览器。

```bash
git clone https://github.com/JaylenVen/VReply.git
cd VReply
python server.py
```

服务启动后，按终端提示在浏览器中访问 VReply，选择学习语言并导入带对应语言字幕的 YouTube 视频。

> VReply 读取视频已有的字幕，不执行语音识别生成字幕。无对应语言字幕、受地区限制或需要登录的视频可能无法使用。

### 影子跟读的浏览器要求

录音需要浏览器允许麦克风访问，并通过 `localhost` 或 HTTPS 打开页面。完整的逐词与流利度反馈还依赖浏览器的 Web Speech Recognition 支持；不支持时仍可录音和回放，但不会生成完整识别指标。建议使用最新版 Chrome 或 Edge。

## 翻译与 AI

基础练习和影子跟读无需模型 API。需要双语字幕时，可在 **设置** 中选择：

- **Chrome 本地翻译**：使用浏览器内置 Translator API，无需 API Key；可用性由页面自动检测。
- **自定义模型 API**：支持兼容 OpenAI Chat Completions 的接口。

模型也可通过环境变量配置：

| 变量 | 说明 |
| --- | --- |
| `VREPLY_LLM_BASE_URL` | API 基础地址 |
| `VREPLY_LLM_API_KEY` | API Key |
| `VREPLY_LLM_MODEL` | 模型名称 |
| `VREPLY_HOST` | 服务监听地址 |
| `VREPLY_PORT` | 服务监听端口 |

页面中填写的 API Key 仅保存在当前服务进程内，不会由配置接口返回浏览器；服务停止后配置失效。请勿提交 API Key，也不要在缺少身份验证和访问控制时将服务直接暴露到公网。

## 开发

```bash
python -m unittest -v
node --check app.js
```

项目内置 [ECDICT](https://github.com/skywind3000/ECDICT) 精简词库。如需从 ECDICT CSV 重建：

```bash
python scripts/build_local_dictionary.py path/to/ecdict.csv
```

ECDICT 数据采用 MIT License，许可文本见 [`third_party/ECDICT-LICENSE.txt`](third_party/ECDICT-LICENSE.txt)。

## 开源与贡献

VReply 源代码采用 [MIT License](LICENSE)。项目内置的 ECDICT 数据同样采用 MIT License，其许可文本单独保存在 [`third_party/ECDICT-LICENSE.txt`](third_party/ECDICT-LICENSE.txt)。

提交 Issue 或 Pull Request 前，请阅读 [贡献指南](CONTRIBUTING.md)。安全问题请按照 [安全策略](SECURITY.md) 私下报告，不要公开披露漏洞细节或 API Key。
