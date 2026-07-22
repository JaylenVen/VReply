# VReply

把带字幕的 YouTube 视频转换为逐句英语或西班牙语跟读练习。

VReply 是一款本地运行的语言学习工具。导入视频后，可按字幕逐句精听、循环播放、查词和复习；基础功能无需账号、前端构建工具或第三方 Python 包。

## 功能

- 英语与西班牙语学习模式
- 字幕同步、点句跳转、上下句切换与单句循环
- 0.5×–3.0× 倍速、音量调节与字幕自动跟随
- 字幕搜索、文本导出、单词收藏与学习时长记录
- 英语本地词典与英/美发音；西班牙/墨西哥发音
- Chrome 本地翻译或自定义模型 API 双语字幕
- 可选 AI 能力：语境查词、句子分析、字幕翻译、内容简介

## 快速开始

要求：Python 3.10+、可访问 YouTube 的现代桌面浏览器。

```bash
git clone https://github.com/JaylenVen/VReply.git
cd VReply
python server.py
```

服务启动后，按终端提示在浏览器中访问 VReply，选择学习语言并导入带对应语言字幕的 YouTube 视频。

> VReply 读取视频已有的字幕，不执行语音识别。无对应语言字幕、受地区限制或需要登录的视频可能无法使用。

## 翻译与 AI

基础练习无需模型 API。需要双语字幕时，可在 **设置** 中选择：

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
