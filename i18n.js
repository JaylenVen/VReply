(function () {
  "use strict";

  const STORAGE_KEY = "vreply:interface-language:v1";
  const ATTRIBUTE_NAMES = [
    "aria-label",
    "data-control-tooltip",
    "data-description",
    "data-hint",
    "data-tooltip",
    "placeholder",
    "title",
  ];
  const CONTENT_SELECTORS = [
    "#summaryPoints",
    "#dictionaryContext",
    "#dictionarySenses",
    "#dictionaryWordForms",
    "#dictionaryEtymology",
    "#dictionaryPhrases",
    "#dictionarySynonyms",
    "#dictionaryWordFamily",
    "#wordPreviewSenses",
    "#wordPreviewForms",
    "#shadowWordResults",
    ".line-original",
    ".line-translation",
    ".caption-word",
  ].join(",");

  const ENGLISH = Object.freeze({
    "返回 VReply 首页": "Return to the VReply home page",
    "日常英语练习": "Daily English Practice",
    "日常西班牙语练习": "Daily Spanish Practice",
    "学习记录": "Learning record",
    "学习时间记录": "Learning time record",
    "累计学习": "Total learning",
    "今天": "Today",
    "少于 1 分钟": "Less than 1 minute",
    "设置": "Settings",
    "打开设置": "Open settings",
    "关闭设置": "Close settings",
    "更换视频": "Change video",
    "界面语言": "Interface language",
    "译": "TR",
    "声": "PR",
    "美": "US",
    "英": "UK",
    "西": "ES",
    "墨": "MX",
    "学习语言": "Learning language",
    "英语": "English",
    "西班牙语": "Spanish",
    "目标语言": "target language",
    "中英": "Chinese–English",
    "中西": "Chinese–Spanish",
    "语言": "Language",
    "粘贴 YouTube 链接": "Paste a YouTube link",
    "YouTube 视频链接": "YouTube video link",
    "导入视频": "Import video",
    "导入": "Import",
    "打开中": "Opening",
    "正在打开视频": "Opening video",
    "口语练习区": "Speaking practice area",
    "视频播放器": "Video player",
    "已导入的视频": "Imported video",
    "正在读取视频…": "Reading video…",
    "正在识别字幕并校准时间。": "Detecting subtitles and aligning timing.",
    "当前双语字幕": "Current bilingual subtitles",
    "当前句子会显示在这里。": "The current sentence will appear here.",
    "译文将在开启翻译后显示": "The translation will appear when translation is enabled",
    "播放控制": "Playback controls",
    "上一句": "Previous sentence",
    "下一句": "Next sentence",
    "播放视频": "Play video",
    "暂停视频": "Pause video",
    "播放": "Play",
    "暂停": "Pause",
    "循环当前句": "Loop current sentence",
    "关闭单句循环": "Turn off sentence loop",
    "播放进度": "Playback progress",
    "听读工具": "Listening tools",
    "调节播放速度": "Adjust playback speed",
    "播放速度": "Playback speed",
    "倍速调节": "Speed control",
    "调节音量": "Adjust volume",
    "音量": "Volume",
    "音量调节": "Volume control",
    "播放音量": "Playback volume",
    "AI 分析当前句子": "Analyze current sentence with AI",
    "AI 句子分析": "AI sentence analysis",
    "切换练习模式": "Switch practice mode",
    "选择练习模式": "Choose practice mode",
    "整体倾听": "Listening",
    "自由播放与精听": "Free playback and close listening",
    "影子跟读": "Shadowing",
    "逐句模仿与录音": "Sentence practice and recording",
    "句子拆解": "Sentence breakdown",
    "关闭句子分析": "Close sentence analysis",
    "正在分析当前句子…": "Analyzing the current sentence…",
    "语法": "Grammar",
    "句式": "Pattern",
    "词组 / 短语": "Phrases",
    "朗读技巧": "Speaking tips",
    "逐句字幕": "Transcript",
    "字幕内容": "Transcript content",
    "内容简介": "Overview",
    "单词": "Words",
    "字幕工具": "Transcript tools",
    "逐句字幕工具": "Transcript tools",
    "自动跟随字幕": "Auto-follow transcript",
    "跟随播放 · 当前句自动居中": "Follow playback · Keep the current sentence centered",
    "跟随": "Follow",
    "双语对照 · 显示或隐藏译文": "Bilingual view · Show or hide translations",
    "译文": "Translation",
    "搜索字幕": "Search transcript",
    "下载字幕": "Download transcript",
    "搜索单词或句子": "Search words or sentences",
    "语境词典": "Context dictionary",
    "收藏这个单词": "Save this word",
    "取消收藏这个单词": "Remove this word from saved words",
    "关闭词典": "Close dictionary",
    "词典释义加载中": "Loading dictionary definition",
    "播放美式发音": "Play US pronunciation",
    "播放英式发音": "Play UK pronunciation",
    "播放西班牙发音": "Play Spain pronunciation",
    "播放墨西哥发音": "Play Mexican pronunciation",
    "美式发音": "US pronunciation",
    "英式发音": "UK pronunciation",
    "西班牙发音": "Spain pronunciation",
    "墨西哥发音": "Mexican pronunciation",
    "词形变化": "Word forms",
    "词源": "Etymology",
    "相关短语": "Related phrases",
    "近义词": "Synonyms",
    "同根词": "Word family",
    "没有找到相关字幕": "No matching transcript lines",
    "换个关键词试试。": "Try another search term.",
    "搜索已收藏的单词": "Search saved words",
    "还没有收藏单词": "No saved words yet",
    "没有找到这个单词": "This word was not found",
    "视频内容简介": "Video overview",
    "打开此页面后，将使用已配置的模型 API 总结视频内容。": "Open this tab to summarize the video with the configured model API.",
    "重新生成": "Regenerate",
    "主要话题": "Main topics",
    "影子跟读教练": "Shadowing coach",
    "选择训练方式": "Choose a training mode",
    "切换训练方式": "Switch training mode",
    "影子跟读训练方式": "Shadowing modes",
    "听一句，读一句": "Listen, then repeat",
    "自动停句": "Pause after each sentence",
    "文本辅助": "Text guidance",
    "标记重音与停顿": "Mark stress and pauses",
    "延迟跟读": "Delayed shadowing",
    "跟随原声连续开口": "Speak continuously after the audio",
    "无字幕挑战": "No-subtitle challenge",
    "隐藏文字练习": "Practice without text",
    "跟读延迟": "Shadowing delay",
    "选择跟读延迟": "Choose shadowing delay",
    "0 秒 · 同步": "0 sec · Simultaneous",
    "0.5 秒 · 高阶": "0.5 sec · Advanced",
    "0.8 秒 · 推荐": "0.8 sec · Recommended",
    "1.2 秒 · 初学": "1.2 sec · Beginner",
    "自定义": "Custom",
    "自定义跟读延迟秒数": "Custom shadowing delay in seconds",
    "秒": "sec",
    "建议佩戴耳机，减少原声回录。": "Wear headphones to reduce audio feedback.",
    "关闭耳机提示": "Dismiss headphone tip",
    "当前句": "Current sentence",
    "字幕准备好后，从第一句开始。": "Start with the first sentence when the transcript is ready.",
    "字幕已隐藏": "Transcript hidden",
    "节奏标记说明": "Rhythm mark guide",
    "粗体": "Bold",
    "重读": "Stress",
    "浅色 弱读": "Dim Weak form",
    "连线 连读": "Link Connected speech",
    "/ 短停顿": "/ Short pause",
    "↗ ↘ 语调": "↗ ↘ Intonation",
    "跟读控制": "Shadowing controls",
    "播放原句": "Play reference",
    "开始录音": "Start recording",
    "停止录音": "Stop recording",
    "开始跟读": "Start shadowing",
    "麦克风": "Microphone",
    "选择录音麦克风": "Choose a recording microphone",
    "系统默认麦克风": "System default microphone",
    "声音对照": "Audio comparison",
    "播放原音": "Play original",
    "模仿完成度": "Overall match",
    "本轮反馈": "Round feedback",
    "录音完成后显示模仿反馈。": "Feedback will appear after recording.",
    "分项评分": "Score breakdown",
    "内容完整度": "Content",
    "流利度": "Fluency",
    "节奏相似度": "Rhythm match",
    "逐词对照": "Word comparison",
    "绿 匹配 · 黄 节奏 · 红 漏读/错读 · 灰 多读 · 下划线 重音提示": "Green match · Yellow rhythm · Red missed/wrong · Gray extra · Underline stress cue",
    "语速": "Speaking rate",
    "非自然停顿": "Unnatural pauses",
    "词错误率 WER": "Word error rate (WER)",
    "环境检测": "Audio check",
    "评分基于浏览器语音识别、停顿与时间对齐，不等同于专业发音准确率。": "Scores use browser speech recognition, pauses, and timing alignment; they are not professional pronunciation ratings.",
    "再来一次": "Try again",
    "本地 ECDICT · 点击查看 AI 语境解析": "Local ECDICT · Click for AI context",
    "AI 语境词典 · 点击查看完整解析": "AI context dictionary · Click for full details",
    "设置分类": "Settings categories",
    "样式": "Appearance",
    "主题": "Theme",
    "静夜": "Night",
    "晴昼": "Day",
    "跟随系统": "Use system setting",
    "字幕": "Subtitles",
    "字幕样式预览": "Subtitle style preview",
    "字号": "Size",
    "字幕字号": "Subtitle size",
    "减小字幕字号": "Decrease subtitle size",
    "增大字幕字号": "Increase subtitle size",
    "原文字体": "Original font",
    "翻译字体": "Translation font",
    "选择原文字体": "Choose original font",
    "选择翻译字体": "Choose translation font",
    "简约": "Sans serif",
    "艺术": "Serif & display",
    "现代中性": "Modern neutral",
    "经典克制": "Classic restraint",
    "精密清晰": "Precise and clear",
    "自然易读": "Natural and readable",
    "理性编辑感": "Editorial and rational",
    "几何轻奢": "Refined geometric",
    "人文书刊感": "Humanist editorial",
    "优雅高对比": "Elegant high contrast",
    "简洁稳重": "Clean and steady",
    "轻盈精致": "Light and refined",
    "清晰耐读": "Clear and readable",
    "纤细现代": "Slender and modern",
    "典雅宋体": "Elegant serif",
    "复古刊物感": "Vintage editorial",
    "手写书法感": "Handwritten calligraphy",
    "思源黑体": "Source Han Sans",
    "苹方": "PingFang SC",
    "微软雅黑": "Microsoft YaHei",
    "等线": "DengXian",
    "思源宋体": "Noto Serif SC",
    "站酷小薇体": "ZCOOL XiaoWei",
    "马善政毛笔楷书": "Ma Shan Zheng",
    "翻译颜色": "Translation color",
    "暖灰": "Warm gray",
    "暖金": "Warm gold",
    "雾绿": "Mist green",
    "自定义翻译颜色": "Custom translation color",
    "自定义颜色": "Custom color",
    "关闭调色盘": "Close color picker",
    "饱和度与明度": "Saturation and brightness",
    "色相": "Hue",
    "十六进制颜色": "Hex color",
    "透明度": "Opacity",
    "查词发音": "Dictionary pronunciation",
    "查词自动发音": "Dictionary pronunciation accent",
    "字幕翻译": "Subtitle translation",
    "翻译方式": "Translation method",
    "Chrome 本地翻译": "Chrome on-device translation",
    "推荐": "Recommended",
    "正在检查浏览器支持情况…": "Checking browser support…",
    "自定义模型 API": "Custom model API",
    "AI 能力": "AI features",
    "按需配置": "Optional",
    "API 支持的功能": "Features supported by the API",
    "句子分析": "Sentence analysis",
    "语境查词": "Context dictionary",
    "API 翻译": "API translation",
    "API 地址": "API URL",
    "模型名称": "Model name",
    "API 密钥": "API key",
    "粘贴 API 密钥": "Paste API key",
    "已保存的密钥不会返回到浏览器。": "The saved key is never returned to the browser.",
    "正在检查翻译服务…": "Checking translation services…",
    "保存设置": "Save settings",
    "正在保存…": "Saving…",
    "默认发音": "Default pronunciation",
    "请先粘贴视频链接。": "Paste a video link first.",
    "这个链接似乎不完整，请检查后重试。": "This link appears incomplete. Check it and try again.",
    "目前仅支持 YouTube 视频链接。": "Only YouTube video links are currently supported.",
    "正在打开视频…": "Opening video…",
    "正在区分自然停顿、对话与背景音乐。": "Separating natural pauses, dialogue, and background music.",
    "正在校准字幕…": "Aligning subtitles…",
    "正在让每一句字幕准确跟上画面。": "Aligning every subtitle line with the video.",
    "字幕即将完成…": "Subtitles are almost ready…",
    "开始练习前，再检查一次时间轴。": "Checking the timeline once more before practice.",
    "字幕已准备好。": "Subtitles are ready.",
    "字幕读取失败。": "Could not load subtitles.",
    "字幕暂不可用": "Subtitles unavailable",
    "字幕读取时间过长，请稍后重试。": "Subtitle loading took too long. Try again later.",
    "字幕服务尚未配置。": "The subtitle service is not configured.",
    "暂时无法为这个视频生成字幕。": "Could not generate subtitles for this video.",
    "已恢复上次进度": "Previous progress restored",
    "YouTube 播放器加载失败": "The YouTube player failed to load",
    "已切换为字幕练习": "Switched to transcript practice",
    "视频预览受限，但仍可通过字幕时间轴继续练习。": "Video preview is restricted, but you can continue with the transcript timeline.",
    "视频内容速览": "Video at a glance",
    "模型未返回视频概括。": "The model did not return a video overview.",
    "暂时无法生成简介": "Could not generate an overview",
    "配置 AI 模型后即可生成。": "Configure an AI model to generate one.",
    "尚未配置模型": "Model not configured",
    "去配置": "Configure",
    "正在总结视频…": "Summarizing video…",
    "正在使用设置中的模型读取字幕并生成中文概括。": "Using the configured model to read the transcript and generate a Chinese overview.",
    "视频内容总结暂时不可用，请稍后重试。": "Video summarization is temporarily unavailable. Try again later.",
    "收藏的单词": "Saved words",
    "当前浏览器不支持，请使用桌面版 Chrome 138 或更高版本。": "This browser is unsupported. Use Chrome 138 or later on desktop.",
    "可以使用，首次翻译时会下载语言包。": "Available. A language pack will download the first time you translate.",
    "语言包准备失败，请重新点击翻译。": "The language pack could not be prepared. Try translation again.",
    "已就绪，字幕内容只在当前浏览器中处理。": "Ready. Subtitle content is processed only in this browser.",
    "已连接": "Connected",
    "翻译必需": "Required for translation",
    "双语对照 · Chrome 本地翻译": "Bilingual view · Chrome on-device translation",
    "请先在设置中启用翻译": "Enable translation in Settings first",
    "双语对照 · 模型翻译": "Bilingual view · Model translation",
    "请先在设置中配置模型": "Configure a model in Settings first",
    "自定义 API 翻译已就绪。": "Custom API translation is ready.",
    "API 翻译尚未配置，请打开设置。": "API translation is not configured. Open Settings.",
    "隐藏全部字幕译文": "Hide all subtitle translations",
    "显示全部字幕译文": "Show all subtitle translations",
    "正在使用 Chrome 本地翻译…": "Translating on device with Chrome…",
    "正在结合语境翻译…": "Translating with context…",
    "点击显示译文": "Click to show translation",
    "译文暂时不可用": "Translation temporarily unavailable",
    "正在生成译文…": "Generating translation…",
    "此浏览器不支持内置翻译，请使用桌面版 Chrome 138 或更高版本，或切换为 API 翻译。": "This browser does not support on-device translation. Use Chrome 138 or later on desktop, or switch to API translation.",
    "正在准备 Chrome 翻译": "Preparing Chrome translation",
    "学习语言已切换，请重新开启翻译。": "The learning language changed. Enable translation again.",
    "Chrome 翻译不可用": "Chrome translation unavailable",
    "API 翻译尚未配置": "API translation is not configured",
    "请在设置中填写模型 API 信息。": "Enter the model API details in Settings.",
    "Chrome 内置翻译尚未准备好，请重新点击译文。": "Chrome on-device translation is not ready. Click Translation again.",
    "Chrome 没有返回该句的翻译，请稍后重试。": "Chrome did not return a translation for this sentence. Try again later.",
    "翻译服务暂时不可用，请稍后再试。": "Translation is temporarily unavailable. Try again later.",
    "已选择 Chrome 本地翻译": "Chrome on-device translation selected",
    "API 尚未配置": "API not configured",
    "模型已配置": "Model configured",
    "密钥已配置且不会返回浏览器；粘贴新密钥即可替换。": "The key is configured and never returned to the browser. Paste a new key to replace it.",
    "密钥只保存在服务进程内存中，服务停止后会自动清除。": "The key is stored only in server memory and is cleared when the server stops.",
    "请填写 API 地址和模型名称。": "Enter an API URL and model name.",
    "配置模型 API 时，请填写 API 密钥。": "Enter an API key when configuring a model API.",
    "暂时无法保存模型配置。": "Could not save the model configuration.",
    "当前浏览器不支持 Chrome 本地翻译，请改用自定义模型 API。": "This browser does not support Chrome on-device translation. Use a custom model API instead.",
    "设置已保存": "Settings saved",
    "字幕将在当前设备上完成翻译。": "Subtitles will be translated on this device.",
    "AI 语言功能暂时不可用。": "AI language features are temporarily unavailable.",
    "已移除单词": "Word removed",
    "仅在当前页面移除": "Removed for this page only",
    "浏览器阻止了永久储存，请检查隐私设置。": "The browser blocked persistent storage. Check your privacy settings.",
    "已收藏单词": "Word saved",
    "已暂存到当前页面": "Saved for this page only",
    "发音": "Pronunciation",
    "点击展开释义": "Click to expand definition",
    "已收藏": "Saved",
    "常用释义": "Common meaning",
    "词形": "Form",
    "常用短语": "Common phrase",
    "本地释义已就绪，AI 正在补充": "Local definition ready; AI is adding context",
    "西班牙语语境查词需要先在设置中配置模型 API。": "Spanish contextual lookup requires a model API configured in Settings.",
    "本地词典暂未收录该词或短语。配置模型 API 后可使用 AI 语境解释。": "The local dictionary does not contain this word or phrase. Configure a model API for an AI context explanation.",
    "AI 补充暂不可用": "AI enrichment temporarily unavailable",
    "本地词典暂时不可用。": "The local dictionary is temporarily unavailable.",
    "当前字幕已失效，请重新导入视频。": "This transcript has expired. Import the video again.",
    "词典查询暂时不可用，请稍后再试。": "Dictionary lookup is temporarily unavailable. Try again later.",
    "浏览器无法读取麦克风": "The browser cannot access microphones",
    "上次使用的麦克风": "Previously used microphone",
    "正在播放原句": "Playing reference",
    "正在回放参考音": "Replaying reference audio",
    "正在请求麦克风": "Requesting microphone",
    "可以开始跟读": "Ready to shadow",
    "正在录音": "Recording",
    "正在生成反馈": "Generating feedback",
    "本轮反馈已完成": "Round feedback ready",
    "准备就绪": "Ready",
    "先听原句": "Listen first",
    "训练方式": "Training mode",
    "节奏脚本": "Rhythm script",
    "同步提示": "Simultaneous cue",
    "听觉挑战": "Listening challenge",
    "正在连接麦克风": "Connecting microphone",
    "请允许浏览器使用麦克风": "Allow the browser to use your microphone",
    "生成反馈中": "Generating feedback",
    "正在分析录音": "Analyzing recording",
    "开始同步跟读": "Start simultaneous shadowing",
    "开始延迟跟读": "Start delayed shadowing",
    "正在播放": "Playing",
    "已检测到声音；当前浏览器不支持语音转文字": "Sound detected; this browser does not support speech-to-text",
    "正在录音；当前浏览器不支持语音转文字": "Recording; this browser does not support speech-to-text",
    "声音已录下；在线语音识别连接失败": "Audio recorded; online speech recognition could not connect",
    "声音已录下；浏览器未允许语音识别": "Audio recorded; the browser did not allow speech recognition",
    "语音识别没有取得当前麦克风": "Speech recognition could not access the current microphone",
    "声音已录下；浏览器不支持当前语言识别": "Audio recorded; the browser does not support recognition for this language",
    "声音已录下；浏览器语音识别未能启动": "Audio recorded; browser speech recognition could not start",
    "没有检测到声音；请切换麦克风": "No sound detected. Switch microphones.",
    "已检测到声音，正在识别…": "Sound detected. Recognizing…",
    "正在听你的声音…": "Listening to your voice…",
    "需要麦克风权限": "Microphone permission required",
    "没有找到麦克风": "No microphone found",
    "麦克风暂不可用": "Microphone unavailable",
    "所选麦克风不可用": "Selected microphone unavailable",
    "请在地址栏允许这个页面使用麦克风，然后再次尝试。": "Allow this page to use your microphone in the address bar, then try again.",
    "请重新连接带麦克风的耳机，或在 Windows 中启用录音设备。": "Reconnect a headset with a microphone, or enable a recording device in Windows.",
    "请关闭可能独占麦克风的应用，再选择正确的录音设备。": "Close apps that may have exclusive microphone access, then choose the correct recording device.",
    "设备可能已断开，请改用系统默认麦克风。": "The device may be disconnected. Use the system default microphone.",
    "请检查 Windows 录音设备和浏览器麦克风权限。": "Check Windows recording devices and browser microphone permissions.",
    "当前浏览器无法录音": "This browser cannot record audio",
    "当前网页地址无法使用麦克风": "Microphone access is unavailable at this address",
    "请使用最新版 Chrome 或 Edge，并允许网页访问麦克风。": "Use the latest Chrome or Edge and allow the page to access your microphone.",
    "请通过 http://127.0.0.1 打开 VReply。": "Open VReply through http://127.0.0.1.",
    "已改用系统默认麦克风": "Switched to the system default microphone",
    "原先选择的录音设备已经不可用。": "The previously selected recording device is no longer available.",
    "无法创建录音": "Could not create a recording",
    "当前浏览器不支持可用的音频录制格式。": "This browser does not support an available audio recording format.",
    "原声已隔离": "Reference audio isolated",
    "需佩戴耳机": "Headphones required",
    "疑似串音": "Possible audio bleed",
    "未见明显串音": "No obvious audio bleed",
    "没有检测到麦克风输入，请切换麦克风后重试。": "No microphone input detected. Switch microphones and try again.",
    "录音完成；本次未获得浏览器识别文本，内容完整度没有计入总分。": "Recording complete. The browser returned no recognized text, so content completeness was not included in the overall score.",
    "这一遍已经很接近原声。下一遍可以缩短延迟，保持同样的完整度。": "This attempt is already close to the original. Next time, shorten the delay while keeping the same completeness.",
    "先把红色漏词补齐，再追求更快的速度。": "Recover the missed words marked in red before increasing speed.",
    "内容已经跟上；下一遍重点模仿词间距和停顿位置。": "The content is complete. Next time, focus on word spacing and pause placement.",
    "尽量一口气完成意群，减少中途停顿和自我修正。": "Complete each thought group in one breath and reduce mid-sentence pauses and self-corrections.",
    "多读内容": "Extra words",
    "漏读": "Missed word",
    "匹配；重音位置可再突出": "Matched; emphasize the stress more",
    "匹配；节奏位置需要注意": "Matched; review the rhythm",
    "匹配良好": "Good match",
    "录音中没有检测到有效声音；请选择真实麦克风，不要选择虚拟音频设备。": "No usable sound was detected. Choose a physical microphone instead of a virtual audio device.",
    "浏览器未返回可用的识别文本；本次仅分析录音时长、停顿与节奏。": "The browser returned no usable recognized text. This attempt only analyzes duration, pauses, and rhythm.",
    "没有识别到清晰文本；请靠近麦克风，再读一遍。": "No clear speech was recognized. Move closer to the microphone and try again.",
    "当前浏览器无法播放发音": "This browser cannot play pronunciation audio",
    "你仍可参考卡片中的音标。": "You can still use the phonetic transcription on the card.",
    "需要配置模型 API": "Model API required",
    "请先在设置中连接用于句子分析的模型。": "Connect a model for sentence analysis in Settings first.",
    "正在拆解语法、句式与朗读节奏…": "Analyzing grammar, sentence pattern, and speaking rhythm…",
    "句子分析暂时不可用，请稍后再试。": "Sentence analysis is temporarily unavailable. Try again later.",
    "已开启单句循环": "Sentence loop enabled",
    "已关闭单句循环": "Sentence loop disabled",
    "当前句子会自动重复播放。": "The current sentence will repeat automatically.",
    "视频将按正常顺序继续播放。": "The video will continue in its normal order.",
    "字幕已下载": "Transcript downloaded",
    "带时间信息的练习字幕已保存。": "The practice transcript with timestamps has been saved.",
    "需要配置 API": "API required"
  });

  const PATTERNS = Object.freeze([
    [/^(\d+) 分钟$/, "$1 min"],
    [/^(\d+) 小时$/, "$1 hr"],
    [/^(\d+) 小时 (\d+) 分$/, "$1 hr $2 min"],
    [/^日常(英语|西班牙语)练习$/, (_match, language) => `Daily ${language === "英语" ? "English" : "Spanish"} Practice`],
    [/^(英语|西班牙语) · 已导入的视频$/, (_match, language) => `${language === "英语" ? "English" : "Spanish"} · Imported video`],
    [/^正在读取(英语|西班牙语)字幕。$/, (_match, language) => `Reading ${language === "英语" ? "English" : "Spanish"} subtitles.`],
    [/^视频已就绪，正在读取(英语|西班牙语)字幕。$/, (_match, language) => `Video ready. Reading ${language === "英语" ? "English" : "Spanish"} subtitles.`],
    [/^正在整理(英语|西班牙语)对话…$/, (_match, language) => `Organizing the ${language === "英语" ? "English" : "Spanish"} dialogue…`],
    [/^现在可以逐句听、循环练，跟着(英语|西班牙语)字幕开口了。$/, (_match, language) => `You can now listen line by line, loop sentences, and speak with the ${language === "英语" ? "English" : "Spanish"} subtitles.`],
    [/^已定位到 (.+)，可以从这里继续。$/, "Resumed at $1. Continue from here."],
    [/^暂时无法读取这个视频的(.+)字幕。$/, "Could not read this video's $1 subtitles."],
    [/^这个视频没有可用的(.+)字幕。$/, "This video has no usable $1 subtitles."],
    [/^从 (.+) 播放第 (\d+) 句$/, "Play sentence $2 from $1"],
    [/^从 (.+) 播放：(.+)$/, "Play from $1: $2"],
    [/^查询 (.+) 的释义$/, "Look up the meaning of $1"],
    [/^字幕翻译进度 (\d+)%$/, "Subtitle translation progress: $1%"],
    [/^整篇字幕翻译进度 (\d+)%$/, "Full transcript translation progress: $1%"],
    [/^整篇字幕翻译进度 (\d+)%，(\d+) 句暂时失败$/, "Full transcript translation progress: $1%; $2 lines failed"],
    [/^第 (\d+) 句译文已显示$/, "Translation for sentence $1 is shown"],
    [/^(隐藏|显示)第 (\d+) 句译文$/, (_match, action, number) => `${action === "隐藏" ? "Hide" : "Show"} translation for sentence ${number}`],
    [/^正在下载(.+)语言包… (\d+)%$/, "Downloading the $1 language pack… $2%"],
    [/^Chrome 内置翻译：(.+)$/, "Chrome on-device translation: $1"],
    [/^首次使用需要下载(.+)语言包，请稍候。$/, "A $1 language pack is required for first use. Please wait."],
    [/^Chrome (.+)翻译语言包准备失败，请检查网络后重试，或切换为 API 翻译。$/, "The Chrome $1 translation pack could not be prepared. Check your connection or switch to API translation."],
    [/^API 已连接 · (.+)$/, "API connected · $1"],
    [/^字幕继续使用 Chrome；内容简介将使用 (.+)。$/, "Subtitles will continue using Chrome; overviews will use $1."],
    [/^未完成的字幕将通过 (.+) 继续翻译。$/, "Unfinished subtitles will continue through $1."],
    [/^已默认使用(.+)；模型 API 尚未配置。$/, "$1 is now the default; the model API is not configured."],
    [/^(.+) 已从单词本中删除。$/, "$1 was removed from saved words."],
    [/^(.+) 会保留在“单词”中。$/, "$1 will remain in Saved Words."],
    [/^(.+?)( · )?本地释义已就绪，AI 正在补充$/, "$1$2Local definition ready; AI is adding context"],
    [/^(.+?)( · )?AI 补充暂不可用$/, "$1$2AI enrichment temporarily unavailable"],
    [/^播放(.+)$/, "Play $1"],
    [/^删除 (.+)$/, "Delete $1"],
    [/^麦克风 (\d+)$/, "Microphone $1"],
    [/^系统默认 · (.+)$/, "System default · $1"],
    [/^切换练习模式，当前：(.+)$/, "Switch practice mode. Current: $1"],
    [/^(\d+(?:\.\d+)?) 秒 · 与说话者同步开口$/, "$1 sec · Speak with the speaker"],
    [/^(\d+(?:\.\d+)?) 秒 · 高阶紧跟$/, "$1 sec · Advanced close shadowing"],
    [/^(\d+(?:\.\d+)?) 秒 · 留出听辨空间$/, "$1 sec · More listening time"],
    [/^(\d+(?:\.\d+)?) 秒 · 听清后紧跟说话者$/, "$1 sec · Follow after listening"],
    [/^第 (\d+) 句 \/ (\d+)$/, "Sentence $1 / $2"],
    [/^第 (\d+) 句$/, "Sentence $1"],
    [/^第 (\d+)–(\d+) 句$/, "Sentences $1–$2"],
    [/^延迟 (\d+(?:\.\d+)?) 秒$/, "$1 sec delay"],
    [/^切换训练方式，当前：(.+)$/, "Switch training mode. Current: $1"],
    [/^识别到：(.+)$/, "Recognized: $1"],
    [/^当前使用 (.+)；请确认它有输入$/, "Using $1; make sure it has input"],
    [/^(.+) 没有检测到声音，请切换麦克风$/, "$1 detected no sound. Switch microphones."],
    [/^(.+) 没有检测到声音，请切换麦克风后重试。$/, "$1 detected no sound. Switch microphones and try again."],
    [/^(\d+) 词\/分$/, "$1 wpm"],
    [/^识别为：(.+)$/, "Recognized as: $1"]
  ]);

  const REVERSE = new Map();
  Object.entries(ENGLISH).forEach(([chinese, english]) => {
    if (!REVERSE.has(english)) REVERSE.set(english, chinese);
  });
  const EMBEDDED_TRANSLATIONS = Object.entries(ENGLISH)
    .filter(([chinese]) => chinese.length > 1)
    .sort(([left], [right]) => right.length - left.length);
  const textOrigins = new WeakMap();
  const attributeOrigins = new WeakMap();
  const CAPTION_STATUS_COPY = new Set([
    "译文将在开启翻译后显示",
    "译文暂时不可用",
    "正在生成译文…",
    "The translation will appear when translation is enabled",
    "Translation temporarily unavailable",
    "Generating translation…",
  ]);
  let locale = readLocale();

  function readLocale() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "zh-CN";
    } catch (_error) {
      return "zh-CN";
    }
  }

  function translateChinese(value) {
    let translated = Object.prototype.hasOwnProperty.call(ENGLISH, value) ? ENGLISH[value] : value;
    if (translated === value) {
      for (const [pattern, replacement] of PATTERNS) {
        if (!pattern.test(value)) continue;
        translated = value.replace(pattern, replacement);
        break;
      }
    }
    if (translated === value) return value;
    EMBEDDED_TRANSLATIONS.forEach(([chinese, english]) => {
      if (translated.includes(chinese)) translated = translated.split(chinese).join(english);
    });
    return translated;
  }

  function translatedValue(value, targetLocale) {
    if (targetLocale === "en") return translateChinese(value);
    return REVERSE.get(value) || value;
  }

  function withWhitespace(value, translator) {
    const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match || !match[2]) return value;
    return `${match[1]}${translator(match[2])}${match[3]}`;
  }

  function isLearningContent(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (element && element.closest("#captionTranslation")) {
      const value = node.nodeType === Node.TEXT_NODE ? node.nodeValue.trim() : element.textContent.trim();
      return !CAPTION_STATUS_COPY.has(value);
    }
    return Boolean(element && element.closest(CONTENT_SELECTORS));
  }

  function translateTextNode(node) {
    if (!node.nodeValue || isLearningContent(node)) return;
    const current = node.nodeValue;
    if (locale === "en") {
      const translated = withWhitespace(current, translateChinese);
      if (translated !== current) {
        textOrigins.set(node, current);
        node.nodeValue = translated;
      }
      return;
    }
    const original = textOrigins.get(node);
    if (original !== undefined && current !== original) {
      node.nodeValue = original;
      return;
    }
    const restored = withWhitespace(current, (value) => translatedValue(value, "zh-CN"));
    if (restored !== current) node.nodeValue = restored;
  }

  function translateAttributes(element) {
    if (!(element instanceof Element)) return;
    let originals = attributeOrigins.get(element);
    ATTRIBUTE_NAMES.forEach((name) => {
      if (!element.hasAttribute(name)) return;
      const current = element.getAttribute(name);
      if (locale === "en") {
        const translated = translateChinese(current);
        if (translated !== current) {
          if (!originals) {
            originals = new Map();
            attributeOrigins.set(element, originals);
          }
          originals.set(name, current);
          element.setAttribute(name, translated);
        }
        return;
      }
      const original = originals && originals.get(name);
      if (original !== undefined && current !== original) {
        element.setAttribute(name, original);
        return;
      }
      const restored = translatedValue(current, "zh-CN");
      if (restored !== current) element.setAttribute(name, restored);
    });
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (!(root instanceof Element) && root !== document) return;
    if (root instanceof Element) translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else translateAttributes(node);
      node = walker.nextNode();
    }
  }

  function syncLanguageControls() {
    document.querySelectorAll("[data-interface-language]").forEach((button) => {
      const active = button.dataset.interfaceLanguage === locale;
      button.setAttribute("aria-checked", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const switcher = document.getElementById("interfaceLanguageSwitch");
    if (switcher) switcher.setAttribute("aria-label", locale === "en" ? "Interface language" : "界面语言");
  }

  function syncDocumentMetadata() {
    document.documentElement.lang = locale;
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = locale === "en"
        ? "VReply turns English or Spanish videos into focused, natural speaking and shadowing practice."
        : "VReply 把英语或西班牙语视频变成专注、自然的口语跟读练习。";
    }
  }

  function setLocale(nextLocale, persist) {
    locale = nextLocale === "en" ? "en" : "zh-CN";
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, locale);
      } catch (_error) {
        // The active page can still change language when storage is blocked.
      }
    }
    syncDocumentMetadata();
    translateTree(document.body);
    syncLanguageControls();
    document.dispatchEvent(new CustomEvent("vreply:localechange", { detail: { locale } }));
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") translateTextNode(mutation.target);
      else if (mutation.type === "attributes") translateAttributes(mutation.target);
      else mutation.addedNodes.forEach(translateTree);
    });
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-interface-language]");
    if (!button) return;
    setLocale(button.dataset.interfaceLanguage, true);
  });

  document.addEventListener("keydown", (event) => {
    const button = event.target.closest("[data-interface-language]");
    if (!button || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    const nextLocale = button.dataset.interfaceLanguage === "en" ? "zh-CN" : "en";
    setLocale(nextLocale, true);
    document.querySelector(`[data-interface-language="${nextLocale}"]`)?.focus();
  });

  syncDocumentMetadata();
  translateTree(document.body);
  syncLanguageControls();
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ATTRIBUTE_NAMES,
    characterData: true,
    childList: true,
    subtree: true,
  });

  window.VReplyI18n = Object.freeze({
    get locale() { return locale; },
    setLocale: (nextLocale) => setLocale(nextLocale, true),
    translate: (value) => locale === "en" ? translateChinese(String(value)) : String(value),
  });
})();
