# VReply

> 把带英文字幕的 YouTube 视频，变成可以跟读、查词和翻译的英语口语练习室。

VReply 是一款轻量级本地网页应用。粘贴 YouTube 视频链接后，你可以跟随时间轴阅读英文字幕、逐句循环跟读，并选择使用 **Chrome 内置翻译**或**自定义模型 API**生成中文字幕。

项目无需安装前端依赖。即使不配置任何 API，也能使用视频播放、字幕同步、循环跟读、字幕搜索和下载等基础功能。

## 功能亮点

| 功能 | 说明 |
| --- | --- |
| YouTube 视频导入 | 粘贴链接即可开始练习 |
| 英文字幕同步 | 当前字幕会跟随视频播放自动高亮 |
| 点击跳转 | 点击字幕即可跳到对应时间 |
| 单句循环 | 反复播放当前句子，方便模仿发音和语调 |
| Chrome 内置翻译 | 无需 API Key，字幕在浏览器中翻译 |
| 自定义 API 翻译 | 支持 OpenAI Chat Completions 兼容服务 |
| AI 语境词典 | 点击单词或选择短语，获得结合上下文的解释 |
| 播放控制 | 支持快退、快进、倍速和静音 |
| 搜索与下载 | 搜索字幕并下载带时间信息的文本 |

## 快速开始

### 运行要求

- Windows、macOS 或 Linux
- Python 3.10 或更高版本
- 可以正常访问 YouTube
- 如需 Chrome 内置翻译：桌面版 Chrome 138 或更高版本
- 如需 API 翻译或 AI 语境词典：对应模型服务的 API Key

### 1. 获取项目

下载或克隆本项目，然后进入项目文件夹。以 Windows PowerShell 为例：

```powershell
cd "C:\path\to\VReply"
```

### 2. 启动 VReply

```powershell
python server.py
```

看到以下提示即表示启动成功：

```text
VReply is running at http://127.0.0.1:4173
```

### 3. 打开网页

在浏览器中访问：

<http://127.0.0.1:4173>

### 4. 导入视频

1. 复制一个带英文字幕的 YouTube 视频链接。
2. 将链接粘贴到首页输入框。
3. 点击 **Import**。
4. 等待字幕加载完成后开始播放和跟读。

> [!IMPORTANT]
> VReply 读取视频已有的英文字幕，不会自动为无字幕视频进行语音识别。建议选择带英文人工字幕或英文自动字幕的视频。

## 选择翻译方式

导入视频后，点击页面右上角的 **Translation**，可以在两种翻译方式之间切换。

### 方式一：Chrome 内置翻译（推荐）

适合希望快速、免费翻译字幕，并且不想配置 API 的用户。

1. 使用桌面版 Chrome 打开 VReply。
2. 导入视频后点击右上角 **Translation**。
3. 选择 **Chrome built-in**。
4. 点击 **Save settings**。
5. 点击字幕面板中的 **译文**。

首次使用时，Chrome 可能需要下载英文到中文的语言包。下载完成后，字幕会直接在浏览器中翻译。

Chrome 内置翻译的特点：

- 不需要 API Key；
- 不产生模型 API 调用费用；
- 字幕文本不会发送到 VReply 的模型服务器；
- 翻译速度快，不会出现大模型思考或 JSON 截断；
- 目前仅适用于支持 Translator API 的桌面版 Chrome；
- 普通机器翻译对俚语、上下文和残缺句子的理解可能不如大模型。

> [!NOTE]
> Chrome 内置翻译只负责字幕英译中。点击单词或短语使用的“语境词典”仍然需要配置模型 API。

### 方式二：自定义模型 API

适合更重视上下文、口语表达和复杂句子翻译质量的用户。

1. 导入视频后点击右上角 **Translation**。
2. 选择 **Custom model API**。
3. 填写 API Base URL、模型名称和 API Key。
4. 点击 **Save settings**。
5. 点击字幕面板中的 **译文**。

当前支持符合以下条件的模型服务：

- 提供 OpenAI 兼容的 `POST /chat/completions` 接口；
- 使用 Bearer API Key 鉴权；
- 返回标准 Chat Completions 响应结构。

#### DeepSeek 配置示例

| 设置项 | 示例值 |
| --- | --- |
| API base URL | `https://api.deepseek.com` |
| Model | `deepseek-v4-flash` |
| API key | 你自己的 DeepSeek API Key |

使用官方 DeepSeek 地址时，VReply 会自动关闭思考模式并启用 JSON Output，让模型直接、快速地返回翻译结果。

网页中填写的 API Key：

- 只会发送给本机运行的 VReply Python 服务；
- 不会通过接口返回到网页；
- 不会保存在浏览器 Local Storage 中；
- 服务器停止后会从内存中清除。

## 如何使用

### 显示译文

- 点击某一行下方的翻译区域，只显示该句译文。
- 点击字幕面板顶部的 **译文**，显示或隐藏当前可见区域的全部译文。

### 查询单词和短语

- 点击一个英文单词，查看它在当前句子中的具体含义。
- 在同一行字幕中横向拖动，选择多个连续单词查询短语。

语境词典使用模型 API。即使字幕选择了 Chrome 内置翻译，词典功能仍需要先配置一次 Custom model API。

### 循环跟读

播放到需要练习的句子后，点击 **Loop this line**。当前句子会自动重复播放，再次点击即可关闭。

### 搜索和下载字幕

- 点击搜索按钮，输入单词或短语筛选字幕。
- 点击下载按钮，将带时间信息的字幕保存为文本文件。

## 使用环境变量配置 API

如果不希望每次启动后都重新填写模型 API，可以在启动 VReply 前设置环境变量。

### Windows PowerShell

```powershell
$env:VREPLY_LLM_BASE_URL="https://api.deepseek.com"
$env:VREPLY_LLM_API_KEY="你的 DeepSeek API Key"
$env:VREPLY_LLM_MODEL="deepseek-v4-flash"

python server.py
```

### macOS / Linux

```bash
export VREPLY_LLM_BASE_URL="https://api.deepseek.com"
export VREPLY_LLM_API_KEY="你的 DeepSeek API Key"
export VREPLY_LLM_MODEL="deepseek-v4-flash"

python3 server.py
```

也可以使用 `DEEPSEEK_API_KEY` 或 `OPENAI_API_KEY` 作为 API Key 的备用环境变量。

## 常见问题

<details>
<summary><strong>为什么没有显示字幕？</strong></summary>

请确认视频本身提供英文字幕。当前版本无法为完全没有字幕的视频自动生成字幕。

</details>

<details>
<summary><strong>为什么看不到 Chrome built-in 选项，或者选项不可用？</strong></summary>

Chrome Translator API 目前主要支持桌面版 Chrome 138 或更高版本，不支持 Chrome 移动版，也不是所有其他浏览器都支持。请更新桌面版 Chrome，或者改用 Custom model API。

</details>

<details>
<summary><strong>第一次使用 Chrome 翻译为什么比较慢？</strong></summary>

Chrome 第一次翻译英文到中文时可能需要下载语言包。下载期间请保持网络连接，不要关闭页面。之后再次使用通常会更快。

</details>

<details>
<summary><strong>为什么“译文”按钮不可用？</strong></summary>

- Chrome 模式：请确认浏览器支持内置翻译，并等待支持状态检查完成。
- API 模式：请打开右上角 **Translation**，填写正确的 Base URL、模型名称和 API Key。

</details>

<details>
<summary><strong>为什么切换翻译方式后，原来的译文消失了？</strong></summary>

这是正常行为。VReply 会在切换引擎时清除旧译文，避免把 Chrome 译文和 API 译文混在一起。再次点击 **译文**即可使用新引擎翻译。

</details>

<details>
<summary><strong>为什么重启后需要重新填写 API Key？</strong></summary>

为了避免把密钥写入浏览器或项目文件，通过网页填写的 API Key 只保存在 Python 进程内存中。需要长期使用时，建议通过环境变量配置。

</details>

<details>
<summary><strong>为什么 AI API 返回 401、403 或 429？</strong></summary>

- `401` 或 `403`：通常表示 API Key 错误、失效或没有访问权限。
- `429`：通常表示请求频率过高、余额不足或调用额度已用完。

请登录对应模型服务商的控制台检查密钥、余额和调用限制。

</details>

## 开发者说明

### 项目结构

```text
VReply/
├── index.html       # 页面结构和翻译设置界面
├── styles.css       # 页面样式
├── app.js           # 播放、字幕、Chrome 翻译和交互逻辑
├── server.py        # 本地服务器、字幕提取和模型 API
├── test_server.py   # 服务端测试
└── README.md
```

### 运行检查

```powershell
python -m unittest -v
node --check app.js
```

### 翻译实现

- Chrome 模式使用浏览器的全局 `Translator` API，源语言为 `en`，目标语言为 `zh`。
- API 模式向本地 `/api/translate` 发送字幕引用和句子编号。
- 切换翻译引擎时，前端会取消 API 请求并清除当前译文缓存。
- 语境词典始终通过 `/api/dictionary` 使用模型 API。

### 自定义字幕服务

在 `app.js` 加载前设置：

```html
<script>
  window.VREPLY_TRANSCRIBE_ENDPOINT = "/api/transcribe";
</script>
```

## 安全提示

> [!WARNING]
> 当前服务器面向个人本地使用。不要在没有额外安全措施的情况下将它直接部署到公网。

网络部署至少应增加身份验证、AI API 地址白名单、每位用户独立的密钥存储、请求额度限制和持久化数据清理策略。

## 反馈与建议

如果你遇到问题或有功能建议，欢迎通过 GitHub Issues 提交反馈。建议附上操作系统、浏览器版本、Python 版本、错误提示和复现步骤；请勿上传你的 API Key。
