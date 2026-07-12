# VReply

VReply 是一款本地运行的英语口语练习工具。粘贴带英文字幕的 YouTube 视频链接，即可按完整句子阅读字幕、逐句跟读、循环播放、查词和翻译。

## 功能

- 按完整英文句子整理字幕，减少断句
- 视频字幕与右侧文本同步高亮
- 点击句子跳转，支持单句循环和倍速播放
- 内置本地英汉词典，查词无需 API
- 支持 Chrome 内置翻译，无需 API Key
- 支持自定义 OpenAI Chat Completions 兼容 API
- 支持字幕搜索与文本下载

## 运行要求

- Python 3.10 或更高版本
- 能够正常访问 YouTube
- 如需 Chrome 内置翻译：桌面版 Chrome 138 或更高版本
- 如需 API 翻译或 AI 语境解释：模型服务商提供的 API Key

## 快速开始

1. 下载项目，并在项目文件夹中打开终端。
2. 启动程序：

   ```bash
   python server.py
   ```

3. 按照终端显示的本地地址打开网页。
4. 粘贴带英文字幕的 YouTube 视频链接，点击 **Import**。

> [!NOTE]
> VReply 使用视频已有的英文字幕。没有英文字幕的视频暂时无法生成练习文本。

## 查词

在英文字幕中点击单词即可查词；横向选中连续单词可以查询短语。

普通查词使用项目内置的 [ECDICT](https://github.com/skywind3000/ECDICT) 英汉词典，全程在本机完成，不需要网络、API Key 或模型费用。词典支持常见单词、短语以及 `agents → agent` 等词形还原。

如果本地词典没有收录所选内容：

- 已配置模型 API：自动使用 AI 结合当前句子解释
- 未配置模型 API：显示未收录提示，不影响其他功能

本项目使用 ECDICT 的精简数据集，原项目采用 MIT License，许可文件见 `third_party/ECDICT-LICENSE.txt`。

## 翻译

导入视频后，点击右上角 **Translation** 选择翻译方式。

### Chrome 内置翻译

- 无需 API Key，也不会产生模型 API 费用
- 翻译在浏览器中完成
- 首次使用可能需要下载中英语言包
- 目前主要支持桌面版 Chrome

### 自定义模型 API

模型服务需要兼容 OpenAI 的 `POST /chat/completions` 接口。

DeepSeek 配置示例：

| 设置项 | 示例 |
| --- | --- |
| API base URL | `https://api.deepseek.com` |
| Model | `deepseek-v4-flash` |
| API key | 用户自己的 API Key |

使用 DeepSeek 官方地址时，VReply 会关闭思考模式，让模型直接返回翻译结果。

## 常用操作

- **显示翻译**：点击句子下方的译文区域，或点击字幕面板顶部的 **译文**
- **查词**：点击单词；横向选中连续单词可查询短语
- **循环跟读**：选择目标句子后点击 **Loop this line**
- **跳转播放**：点击右侧字幕或时间标签
- **搜索和下载**：使用字幕面板顶部的搜索和下载按钮

## 使用环境变量配置 API

需要在每次启动时自动载入 API 配置，可以设置：

```text
VREPLY_LLM_BASE_URL
VREPLY_LLM_API_KEY
VREPLY_LLM_MODEL
```

然后运行：

```bash
python server.py
```

通过网页填写的 API Key 只保存在当前 Python 进程内存中，服务器停止后会被清除。

## 常见问题

<details>
<summary><strong>Chrome 内置翻译不可用怎么办？</strong></summary>

请更新桌面版 Chrome，或在 **Translation** 中改用自定义模型 API。Chrome 移动版和部分其他浏览器暂不支持该功能。

</details>

<details>
<summary><strong>为什么有些短语查不到？</strong></summary>

本地词典优先收录常用单词和短语，并不包含所有自由组合。可以缩短所选短语，或配置模型 API 使用 AI 语境解释。

</details>

<details>
<summary><strong>字幕为什么仍会出现不完整句子？</strong></summary>

VReply 优先根据英文句末标点合并字幕。对于没有标点的自动字幕，会在明显停顿或内容过长时兜底分段。

</details>

## 开发与测试

项目不需要安装第三方 Python 或前端依赖。

```bash
python -m unittest -v
node --check app.js
```

如需从 ECDICT 原始 CSV 重新生成精简词典：

```bash
python scripts/build_local_dictionary.py ecdict.csv
```

## 安全提示

本项目面向个人本地使用。请勿上传或公开分享 API Key，也不要在缺少身份验证和访问控制的情况下直接部署到公网。

## 反馈

欢迎通过 GitHub Issues 提交问题和建议。请附上操作系统、浏览器、Python 版本、错误提示和复现步骤，不要上传 API Key。
