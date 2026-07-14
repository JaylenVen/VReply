# VReply

> 把 YouTube 视频变成逐句英语口语练习。

VReply 是一款本地运行的英语听说练习工具。粘贴带英文字幕的 YouTube 链接，即可边看视频，边按句精听、跟读、查词和复习；基础练习无需账号，也无需安装第三方依赖。

## 主要功能

- **逐句精听**：自动整理英文字幕并同步视频进度，支持点句跳转、上一句/下一句和单句循环。
- **灵活播放**：0.5×–3.0× 八档倍速、连续音量调节、播放进度拖动和字幕自动跟随。
- **双语字幕**：可使用 Chrome 本地翻译，或接入兼容 Chat Completions 的模型 API；字号、字体、颜色、透明度和字重均可调整。
- **本地查词**：内置精简版 ECDICT，支持点击单词、选择词组、美英发音和常见词形查询，常规查词无需 API。
- **AI 辅助**：配置模型后可使用语境查词、句子分析、字幕翻译和视频内容简介。
- **复习整理**：支持字幕搜索与纯文本下载。

## 快速开始

运行环境：Python 3.10+，以及能够访问 YouTube 的现代桌面浏览器。

```bash
python server.py
```

打开终端显示的 `http://127.0.0.1:4173`，粘贴 YouTube 链接并点击 **导入**。

> [!NOTE]
> VReply 使用视频已有的英文字幕，不会为无英文字幕的视频进行语音识别。

## 翻译与 AI

在页面右上角进入 **设置**：

- **Chrome 本地翻译**：桌面版 Chrome 138+，无需 API Key；首次使用可能需要下载语言包。
- **自定义模型 API**：填写兼容 `POST /chat/completions` 的 API 地址、模型名称和 API Key。

也可以在启动前设置环境变量：

| 变量 | 用途 |
| --- | --- |
| `VREPLY_LLM_BASE_URL` | 模型 API 基础地址 |
| `VREPLY_LLM_API_KEY` | 模型 API Key |
| `VREPLY_LLM_MODEL` | 模型名称 |
| `VREPLY_HOST` / `VREPLY_PORT` | 本地服务监听地址与端口 |

API Key 仅保存在当前本地服务进程中，不会通过配置接口返回到浏览器；关闭服务后，页面内填写的配置会失效。

## 项目结构

```text
.
├─ index.html / styles.css / app.js   # 前端页面、样式与交互
├─ server.py                          # 静态服务、字幕与语言功能 API
├─ test_server.py                     # 后端单元测试
├─ assets/                            # 首页视觉素材
├─ data/                              # 本地 ECDICT 精简词库与说明
├─ scripts/                           # 词库构建脚本
└─ third_party/                       # 第三方许可文件
```

项目不依赖前端构建工具或第三方 Python 包。

## 开发与测试

```bash
python -m unittest -v
node --check app.js
```

如需从 ECDICT CSV 重建本地词库：

```bash
python scripts/build_local_dictionary.py path/to/ecdict.csv
```

## 使用边界与安全

- 仅支持 YouTube、`youtu.be`、Shorts 和 Embed 形式的有效视频链接。
- 字幕与缩略图获取依赖 YouTube 当前可用性和视频权限。
- VReply 面向个人本地使用；请勿提交 API Key，也不要在缺少身份验证和访问控制时直接部署到公网。

## 反馈

欢迎通过 GitHub Issues 提交问题或建议。请附上操作系统、浏览器、Python 版本和复现步骤，并移除所有敏感信息。
