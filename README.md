# VReply

VReply 是一款本地运行的英语口语练习工具。粘贴带英文字幕的 YouTube 视频链接，即可同步阅读完整句子、逐句跟读、循环播放、查词和翻译。

## 主要功能

- 按完整英文句子整理字幕，减少断句对阅读和翻译的影响
- 视频字幕与右侧文本同步高亮
- 点击句子跳转，支持单句循环和倍速播放
- 支持 Chrome 内置翻译，无需 API Key
- 支持自定义 OpenAI Chat Completions 兼容 API
- 支持结合上下文的单词和短语解释
- 支持字幕搜索与文本下载

## 运行要求

- Python 3.10 或更高版本
- 能够正常访问 YouTube
- Chrome 内置翻译需要桌面版 Chrome 138 或更高版本
- API 翻译和语境词典需要模型服务商提供的 API Key

## 快速开始

1. 下载项目，并在项目文件夹中打开终端。
2. 启动程序：

   ```bash
   python server.py
   ```

3. 按照终端显示的本地访问地址打开网页。
4. 粘贴带英文字幕的 YouTube 视频链接，点击 **Import**。

> [!NOTE]
> VReply 使用视频已有的英文字幕。没有英文字幕的视频暂时无法生成练习文本。

## 翻译方式

导入视频后，点击右上角 **Translation** 选择翻译方式。

### Chrome 内置翻译

适合不想配置 API 的用户：

- 无需 API Key，也不会产生模型 API 费用
- 翻译在浏览器中完成
- 首次使用可能需要下载中英语言包
- 目前主要支持桌面版 Chrome

### 自定义模型 API

适合希望获得更强上下文理解能力的用户。模型服务需要兼容 OpenAI 的 `POST /chat/completions` 接口。

DeepSeek 示例：

| 设置项 | 示例 |
| --- | --- |
| API base URL | `https://api.deepseek.com` |
| Model | `deepseek-v4-flash` |
| API key | 用户自己的 API Key |

使用 DeepSeek 官方地址时，VReply 会关闭思考模式，让模型直接返回翻译结果。

> [!IMPORTANT]
> Chrome 内置翻译只负责字幕翻译。语境词典仍需要配置模型 API。

## 基本操作

- **显示翻译**：点击单句下方的译文区域，或点击字幕面板顶部的 **译文**。
- **查词**：点击单词；横向选择连续单词可查询短语。
- **循环跟读**：选择目标句子后点击 **Loop this line**。
- **跳转播放**：点击右侧字幕或时间标签。
- **搜索和下载**：使用字幕面板顶部的搜索和下载按钮。

## 环境变量配置 API

希望每次启动时自动载入 API 配置，可以设置：

```text
VREPLY_LLM_BASE_URL
VREPLY_LLM_API_KEY
VREPLY_LLM_MODEL
```

然后正常运行：

```bash
python server.py
```

通过网页填写的 API Key 只保存在当前 Python 进程内存中，服务器停止后会被清除。

## 常见问题

<details>
<summary><strong>字幕为什么仍然出现不完整句子？</strong></summary>

VReply 优先根据英文句末标点合并字幕。对于没有标点的自动字幕，会在明显停顿或内容过长时进行兜底分段，避免整段视频合并成一条字幕。

</details>

<details>
<summary><strong>Chrome 内置翻译不可用怎么办？</strong></summary>

请更新桌面版 Chrome，或在 **Translation** 中改用自定义模型 API。Chrome 移动版和部分其他浏览器暂不支持该功能。

</details>

<details>
<summary><strong>为什么重启后需要重新填写 API Key？</strong></summary>

网页填写的密钥不会写入项目文件或浏览器存储。需要长期使用时，请通过环境变量配置。

</details>

## 开发与测试

项目不需要安装前端依赖。修改后可以运行：

```bash
python -m unittest -v
node --check app.js
```

主要文件：

```text
index.html       页面结构
styles.css       页面样式
app.js           播放、字幕和浏览器翻译
server.py        本地服务、字幕处理和模型 API
test_server.py   服务端测试
```

## 安全提示

当前项目面向个人本地使用。不要在缺少身份验证、访问控制、请求限额和 API 地址白名单的情况下直接部署到公网。

## 反馈

欢迎通过 GitHub Issues 提交问题和建议。请提供操作系统、浏览器与 Python 版本、错误提示和复现步骤，不要上传 API Key。
