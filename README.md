# VReply

> 把 YouTube 视频变成逐句英语口语练习。

VReply 是一款本地运行的英语跟读工具。粘贴带英文字幕的 YouTube 链接，即可同步播放视频、阅读双语字幕、逐句循环、查词与跟读。

## 主要功能

- 英文字幕按完整语句整理，并与视频进度同步
- 0.5×–3.0× 八档倍速与连续音量调节
- 双语重点字幕、逐句跳转与单句循环
- 本地 ECDICT 英汉查词，常规查询无需 API
- 支持 Chrome 内置翻译或 OpenAI Chat Completions 兼容 API
- 字幕搜索与文本下载

## 快速开始

需要 Python 3.10+，并确保当前网络能够访问 YouTube。

```bash
python server.py
```

根据终端提示打开本地地址，粘贴带英文字幕的 YouTube 链接并点击 **Import**。

> [!NOTE]
> VReply 使用视频已有的英文字幕；暂不支持为无英文字幕的视频生成练习文本。

## 翻译与查词

点击页面右上角 **设置 → 翻译与发音** 选择翻译方式：

- **Chrome 内置翻译**：桌面版 Chrome 138+，无需 API Key；首次使用可能下载语言包。
- **自定义模型 API**：填写兼容 `POST /chat/completions` 的服务地址、模型与 API Key。

也可以在启动前设置：

```text
VREPLY_LLM_BASE_URL
VREPLY_LLM_API_KEY
VREPLY_LLM_MODEL
```

字幕中的单词可直接点击查询，连续词组可拖选查询。常规查词由项目内置的 [ECDICT](https://github.com/skywind3000/ECDICT) 精简词库在本地完成；许可见 `third_party/ECDICT-LICENSE.txt`。

## 开发与测试

项目无需安装第三方前端或 Python 依赖。

```bash
python -m unittest -v
node --check app.js
```

## 安全提示

VReply 面向个人本地使用。请勿提交或公开分享 API Key，也不要在缺少身份验证与访问控制时直接部署到公网。

## 反馈

欢迎通过 GitHub Issues 提交问题与建议。请附上系统、浏览器、Python 版本及复现步骤，并移除所有敏感信息。
