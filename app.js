(function () {
  "use strict";

  const DEFAULT_DURATION = 150;
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3];
  const TRANSLATION_ENGINE_KEY = "vreply:translation-engine";
  const PRONUNCIATION_ACCENT_KEY = "vreply:pronunciation-accent";
  const SUBTITLE_STYLE_KEY = "vreply:subtitle-style";
  const HOVER_LOOKUP_DELAY_MS = 650;
  const HOVER_MOTION_TOLERANCE_PX = 6;
  const DEFAULT_SUBTITLE_STYLE = Object.freeze({
    scale: 100,
    originalFont: "inter",
    translationFont: "source-han-sans",
    translationColor: "#d8d1c3",
    opacity: 80,
    bold: false,
  });
  const ORIGINAL_FONTS = Object.freeze({
    inter: '"Inter", "Helvetica Neue", sans-serif',
    "helvetica-neue": '"Helvetica Neue", Helvetica, sans-serif',
    "sf-pro-display": '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
    "segoe-ui": '"Segoe UI", "Helvetica Neue", sans-serif',
    "ibm-plex-sans": '"IBM Plex Sans", "Helvetica Neue", sans-serif',
    manrope: '"Manrope", "Helvetica Neue", sans-serif',
    "source-serif-4": '"Source Serif 4", Georgia, serif',
    "cormorant-garamond": '"Cormorant Garamond", Georgia, serif',
  });
  const TRANSLATION_FONTS = Object.freeze({
    "source-han-sans": '"Source Han Sans SC", "Source Han Sans CN", "Noto Sans SC", sans-serif',
    "pingfang-sc": '"PingFang SC", "Microsoft YaHei", sans-serif',
    "microsoft-yahei": '"Microsoft YaHei", "Noto Sans SC", sans-serif',
    dengxian: 'DengXian, "Microsoft YaHei", sans-serif',
    "noto-serif-sc": '"Noto Serif SC", "Source Han Serif SC", SimSun, serif',
    "zcool-xiaowei": '"ZCOOL XiaoWei", "Noto Serif SC", SimSun, serif',
    "ma-shan-zheng": '"Ma Shan Zheng", STKaiti, KaiTi, cursive',
  });
  const COMMON_PHRASES = new Map(Object.entries({
    "a little bit": ["一点；稍微", "to a small degree"],
    "a lot of": ["许多；大量", "a large amount or number of"],
    "according to": ["根据；按照", "as stated or reported by"],
    "all the time": ["一直；始终", "continuously or very often"],
    "as a result": ["因此；结果", "because of what happened"],
    "as long as": ["只要；在……期间", "provided that"],
    "as soon as": ["一……就……", "immediately when"],
    "as well": ["也；还", "in addition"],
    "at least": ["至少", "not less than"],
    "be able to": ["能够", "have the ability to"],
    "be supposed to": ["应该；按理应当", "be expected or required to"],
    "because of": ["因为；由于", "on account of"],
    "by the way": ["顺便说一下", "used to introduce a side topic"],
    "come from": ["来自；源于", "originate in"],
    "come up with": ["想出；提出", "produce an idea or solution"],
    "deal with": ["处理；应对", "take action about something"],
    "end up": ["最终成为；最后处于", "eventually reach a situation"],
    "even though": ["尽管；虽然", "despite the fact that"],
    "figure out": ["弄懂；想出", "understand or solve"],
    "find out": ["查明；发现", "discover information"],
    "for example": ["例如", "used to introduce an example"],
    "for instance": ["例如", "as an example"],
    "get back": ["回来；取回", "return or recover"],
    "get used to": ["习惯于", "become accustomed to"],
    "go ahead": ["继续；请便", "proceed"],
    "go back": ["回去；追溯", "return to a place or time"],
    "going to": ["将要；打算", "planning or expected to"],
    "have to": ["不得不；必须", "be required to"],
    "in fact": ["事实上", "used to emphasize what is true"],
    "in front of": ["在……前面", "before or ahead of"],
    "in order to": ["为了", "for the purpose of"],
    "instead of": ["而不是；代替", "in place of"],
    "it turns out": ["结果是；原来", "the eventual fact is"],
    "keep in mind": ["记住；留意", "remember and consider"],
    "kind of": ["有点；某种程度上", "somewhat or approximately"],
    "look after": ["照顾", "take care of"],
    "look at": ["看；审视", "direct attention toward"],
    "look for": ["寻找", "try to find"],
    "look forward to": ["期待", "feel pleased about something future"],
    "make sure": ["确保；确认", "check that something is certain"],
    "more than": ["超过；不仅仅", "greater than"],
    "next to": ["紧挨着；几乎", "beside"],
    "no matter": ["无论；不管", "regardless of"],
    "of course": ["当然", "as expected or naturally"],
    "on the other hand": ["另一方面", "used to present a contrast"],
    "one of the": ["……之一", "a single member of a group"],
    "out of": ["从……中；因为；缺少", "from within or because of"],
    "pick up": ["拿起；接人；学会", "collect, lift, or learn informally"],
    "put on": ["穿上；播放；增加", "place clothing on or present"],
    "rather than": ["而不是", "instead of"],
    "right now": ["现在；立刻", "at this moment"],
    "so that": ["以便；所以", "in order that"],
    "sort of": ["有点；算是", "somewhat"],
    "take a look": ["看一看", "look briefly"],
    "take care of": ["照顾；处理", "look after or handle"],
    "take off": ["脱下；起飞；迅速成功", "remove, leave the ground, or grow quickly"],
    "the rest of": ["其余的", "what remains"],
    "thanks to": ["多亏；由于", "because of"],
    "turn off": ["关闭；使厌烦", "stop a device or repel"],
    "turn on": ["打开；启动", "start a device"],
    "used to": ["过去常常", "describes a past habit or state"],
    "work on": ["从事；改善", "spend time developing something"],
  }));

  const COMMON_PHRASE_ENTRIES = Array.from(COMMON_PHRASES.keys())
    .map((phrase) => ({ phrase, tokens: phrase.split(" ") }))
    .sort((left, right) => right.tokens.length - left.tokens.length);

  function initialTranslationEngine() {
    try {
      const saved = localStorage.getItem(TRANSLATION_ENGINE_KEY);
      if (saved === "chrome" || saved === "api") return saved;
    } catch (_error) {
      // Storage can be unavailable in privacy-focused browsing modes.
    }
    return "Translator" in self ? "chrome" : "api";
  }

  function initialPronunciationAccent() {
    try {
      return localStorage.getItem(PRONUNCIATION_ACCENT_KEY) === "en-GB" ? "en-GB" : "en-US";
    } catch (_error) {
      return "en-US";
    }
  }

  function initialSubtitleStyle() {
    try {
      const saved = JSON.parse(localStorage.getItem(SUBTITLE_STYLE_KEY) || "null");
      if (!saved || typeof saved !== "object") return { ...DEFAULT_SUBTITLE_STYLE };
      return {
        scale: Math.max(80, Math.min(130, Math.round((Number(saved.scale) || 100) / 10) * 10)),
        originalFont: ORIGINAL_FONTS[saved.originalFont] ? saved.originalFont : DEFAULT_SUBTITLE_STYLE.originalFont,
        translationFont: TRANSLATION_FONTS[saved.translationFont] ? saved.translationFont : DEFAULT_SUBTITLE_STYLE.translationFont,
        translationColor: /^#[0-9a-f]{6}$/i.test(saved.translationColor) ? saved.translationColor : DEFAULT_SUBTITLE_STYLE.translationColor,
        opacity: Math.max(40, Math.min(100, Math.round((Number(saved.opacity) || 80) / 5) * 5)),
        bold: Boolean(saved.bold),
      };
    } catch (_error) {
      return { ...DEFAULT_SUBTITLE_STYLE };
    }
  }

  const elements = {
    landingView: document.getElementById("landingView"),
    workspaceView: document.getElementById("workspaceView"),
    brandButton: document.getElementById("brandButton"),
    newVideoButton: document.getElementById("newVideoButton"),
    aiSettingsButton: document.getElementById("aiSettingsButton"),
    aiSettingsModal: document.getElementById("aiSettingsModal"),
    aiSettingsClose: document.getElementById("aiSettingsClose"),
    aiSettingsForm: document.getElementById("aiSettingsForm"),
    aiBaseUrl: document.getElementById("aiBaseUrl"),
    aiModel: document.getElementById("aiModel"),
    aiApiKey: document.getElementById("aiApiKey"),
    aiKeyHint: document.getElementById("aiKeyHint"),
    aiSettingsError: document.getElementById("aiSettingsError"),
    aiSettingsSave: document.getElementById("aiSettingsSave"),
    aiConfigStatus: document.getElementById("aiConfigStatus"),
    settingsNav: document.querySelector(".settings-nav"),
    settingsPanes: Array.from(document.querySelectorAll("[data-settings-pane]")),
    subtitleScaleDown: document.getElementById("subtitleScaleDown"),
    subtitleScaleUp: document.getElementById("subtitleScaleUp"),
    subtitleScaleValue: document.getElementById("subtitleScaleValue"),
    subtitleOriginalFont: document.getElementById("subtitleOriginalFont"),
    subtitleTranslationFont: document.getElementById("subtitleTranslationFont"),
    subtitleTranslationColor: document.getElementById("subtitleTranslationColor"),
    subtitleColorOptions: document.getElementById("subtitleColorOptions"),
    customColorButton: document.getElementById("customColorButton"),
    subtitleColorPicker: document.getElementById("subtitleColorPicker"),
    colorPickerClose: document.getElementById("colorPickerClose"),
    colorSaturation: document.getElementById("colorSaturation"),
    colorHue: document.getElementById("colorHue"),
    colorPreview: document.getElementById("colorPreview"),
    subtitleOpacity: document.getElementById("subtitleOpacity"),
    subtitleOpacityValue: document.getElementById("subtitleOpacityValue"),
    subtitleBold: document.getElementById("subtitleBold"),
    subtitlePreviewOriginal: document.getElementById("subtitlePreviewOriginal"),
    subtitlePreviewTranslation: document.getElementById("subtitlePreviewTranslation"),
    translationEngineChrome: document.getElementById("translationEngineChrome"),
    translationEngineApi: document.getElementById("translationEngineApi"),
    pronunciationAccentUs: document.getElementById("pronunciationAccentUs"),
    pronunciationAccentUk: document.getElementById("pronunciationAccentUk"),
    chromeEngineOption: document.getElementById("chromeEngineOption"),
    chromeTranslationStatus: document.getElementById("chromeTranslationStatus"),
    apiSettingsFields: document.getElementById("apiSettingsFields"),
    aiCapabilitySection: document.getElementById("aiCapabilitySection"),
    aiRequirementBadge: document.getElementById("aiRequirementBadge"),
    urlForm: document.getElementById("urlForm"),
    videoUrl: document.getElementById("videoUrl"),
    urlField: document.getElementById("urlField"),
    urlError: document.getElementById("urlError"),
    submitButton: document.querySelector("#urlForm .submit-button"),
    projectTitle: document.getElementById("projectTitle"),
    videoStage: document.getElementById("videoStage"),
    videoAmbient: document.getElementById("videoAmbient"),
    videoMount: document.getElementById("videoMount"),
    videoPlaceholder: document.getElementById("videoPlaceholder"),
    captionOverlay: document.getElementById("captionOverlay"),
    captionText: document.getElementById("captionText"),
    captionTranslation: document.getElementById("captionTranslation"),
    extractOverlay: document.getElementById("extractOverlay"),
    extractTitle: document.getElementById("extractTitle"),
    extractDetail: document.getElementById("extractDetail"),
    extractProgress: document.getElementById("extractProgress"),
    rewindButton: document.getElementById("rewindButton"),
    playButton: document.getElementById("playButton"),
    forwardButton: document.getElementById("forwardButton"),
    currentTime: document.getElementById("currentTime"),
    durationTime: document.getElementById("durationTime"),
    progressRange: document.getElementById("progressRange"),
    progressFill: document.getElementById("progressFill"),
    progressTooltip: document.getElementById("progressTooltip"),
    speedButton: document.getElementById("speedButton"),
    speedButtonValue: document.getElementById("speedButtonValue"),
    speedPopover: document.getElementById("speedPopover"),
    speedRange: document.getElementById("speedRange"),
    speedValue: document.getElementById("speedValue"),
    volumeButton: document.getElementById("volumeButton"),
    volumePopover: document.getElementById("volumePopover"),
    volumeRange: document.getElementById("volumeRange"),
    volumeValue: document.getElementById("volumeValue"),
    analysisButton: document.getElementById("analysisButton"),
    analysisCard: document.getElementById("analysisCard"),
    analysisClose: document.getElementById("analysisClose"),
    analysisSentence: document.getElementById("analysisSentence"),
    analysisStatus: document.getElementById("analysisStatus"),
    analysisContent: document.getElementById("analysisContent"),
    analysisGrammar: document.getElementById("analysisGrammar"),
    analysisPattern: document.getElementById("analysisPattern"),
    analysisPhrases: document.getElementById("analysisPhrases"),
    analysisReading: document.getElementById("analysisReading"),
    loopButton: document.getElementById("loopButton"),
    transcriptPanel: document.getElementById("transcriptPanel"),
    transcriptCount: document.getElementById("transcriptCount"),
    transcriptScroll: document.getElementById("transcriptScroll"),
    transcriptSkeleton: document.getElementById("transcriptSkeleton"),
    transcriptList: document.getElementById("transcriptList"),
    transcriptEmpty: document.getElementById("transcriptEmpty"),
    followToggle: document.getElementById("followToggle"),
    searchButton: document.getElementById("searchButton"),
    searchRow: document.getElementById("searchRow"),
    transcriptSearch: document.getElementById("transcriptSearch"),
    searchResultCount: document.getElementById("searchResultCount"),
    downloadButton: document.getElementById("downloadButton"),
    translationToggle: document.getElementById("translationToggle"),
    translationProgress: document.getElementById("translationProgress"),
    languageStatus: document.getElementById("languageStatus"),
    transcriptTab: document.getElementById("transcriptTab"),
    summaryTab: document.getElementById("summaryTab"),
    summaryView: document.getElementById("summaryView"),
    summaryTitle: document.getElementById("summaryTitle"),
    summaryOverview: document.getElementById("summaryOverview"),
    summaryTopics: document.getElementById("summaryTopics"),
    summaryPoints: document.getElementById("summaryPoints"),
    summaryRetryButton: document.getElementById("summaryRetryButton"),
    dictionaryCard: document.getElementById("dictionaryCard"),
    dictionaryClose: document.getElementById("dictionaryClose"),
    dictionaryTerm: document.getElementById("dictionaryTerm"),
    dictionaryMeta: document.getElementById("dictionaryMeta"),
    dictionaryStatus: document.getElementById("dictionaryStatus"),
    dictionaryLoading: document.getElementById("dictionaryLoading"),
    dictionaryContent: document.getElementById("dictionaryContent"),
    dictionaryPronunciations: document.getElementById("dictionaryPronunciations"),
    dictionaryPronunciationUS: document.getElementById("dictionaryPronunciationUS"),
    dictionaryPronunciationUK: document.getElementById("dictionaryPronunciationUK"),
    dictionaryContext: document.getElementById("dictionaryContext"),
    dictionarySenses: document.getElementById("dictionarySenses"),
    dictionaryWordFormsBlock: document.getElementById("dictionaryWordFormsBlock"),
    dictionaryWordForms: document.getElementById("dictionaryWordForms"),
    dictionaryEtymologyBlock: document.getElementById("dictionaryEtymologyBlock"),
    dictionaryEtymology: document.getElementById("dictionaryEtymology"),
    dictionaryPhrasesBlock: document.getElementById("dictionaryPhrasesBlock"),
    dictionaryPhrases: document.getElementById("dictionaryPhrases"),
    dictionarySynonymsBlock: document.getElementById("dictionarySynonymsBlock"),
    dictionarySynonyms: document.getElementById("dictionarySynonyms"),
    dictionaryWordFamilyBlock: document.getElementById("dictionaryWordFamilyBlock"),
    dictionaryWordFamily: document.getElementById("dictionaryWordFamily"),
    wordPreview: document.getElementById("wordPreview"),
    wordPreviewTerm: document.getElementById("wordPreviewTerm"),
    wordPreviewMeta: document.getElementById("wordPreviewMeta"),
    wordPreviewPronunciationUS: document.getElementById("wordPreviewPronunciationUS"),
    wordPreviewPronunciationUK: document.getElementById("wordPreviewPronunciationUK"),
    wordPreviewSenses: document.getElementById("wordPreviewSenses"),
    wordPreviewForms: document.getElementById("wordPreviewForms"),
    toast: document.getElementById("toast"),
    toastTitle: document.getElementById("toastTitle"),
    toastText: document.getElementById("toastText"),
  };

  const state = {
    source: null,
    transcript: [],
    activeIndex: -1,
    currentTime: 0,
    duration: DEFAULT_DURATION,
    playing: false,
    volume: 100,
    speed: 1,
    loopLine: false,
    autoFollow: true,
    playerKind: null,
    playerReady: false,
    ytPlayer: null,
    directPlayer: null,
    simulatedPlayback: false,
    lastTickAt: performance.now(),
    loadToken: 0,
    toastTimer: null,
    ticker: null,
    lastCaptionWord: -1,
    transcriptId: null,
    interactiveReady: false,
    languageAvailable: false,
    llmConfig: null,
    translationEngine: initialTranslationEngine(),
    pronunciationAccent: initialPronunciationAccent(),
    subtitleStyle: initialSubtitleStyle(),
    settingsStyleSnapshot: null,
    chromeTranslationAvailability: "checking",
    chromeTranslator: null,
    chromeTranslatorPromise: null,
    chromeDownloadProgress: 0,
    showTranslations: false,
    revealedTranslations: new Set(),
    translations: new Map(),
    translationErrors: new Map(),
    translationQueue: new Set(),
    translationInFlight: new Set(),
    translationControllers: new Set(),
    translationTimer: null,
    translationActiveBatches: 0,
    translationObserver: null,
    dictionaryCache: new Map(),
    localDictionaryCache: new Map(),
    dictionaryController: null,
    dictionaryRequestId: 0,
    wordPreviewTimer: null,
    wordPreviewController: null,
    wordPreviewTarget: null,
    timelineHovering: false,
    studyOverlay: null,
    resumeAfterStudy: false,
    analysisCache: new Map(),
    analysisController: null,
    analysisRequestId: 0,
    phrasePointer: null,
    suppressWordClick: false,
    hoverLookupTimer: null,
    hoverLookupCandidate: null,
    hoverLookupPoint: null,
    hoverLookupTarget: null,
    panelView: "transcript",
    summaryController: null,
    summaryLoading: false,
    summaryTranscriptId: null,
  };

  let youTubeApiPromise = null;
  let colorPickerHsv = { h: 40, s: 0.13, v: 0.85 };
  let colorPickerDragging = false;

  function userMessage(value, fallback) {
    const text = String(value || "").trim();
    return /[\u3400-\u9fff]/u.test(text) ? text : fallback;
  }

  function parseVideoUrl(value) {
    let raw = String(value || "").trim();
    if (!raw) return { error: "请先粘贴视频链接。" };
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    let url;
    try {
      url = new URL(raw);
    } catch (_error) {
      return { error: "这个链接似乎不完整，请检查后重试。" };
    }

    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
      if (!videoId && /^\/(shorts|embed)\//.test(url.pathname)) {
        videoId = url.pathname.split("/").filter(Boolean)[1] || "";
      }
    }

    if (/^[a-zA-Z0-9_-]{6,}$/.test(videoId)) {
      return {
        kind: "youtube",
        id: videoId,
        url: url.href,
        provider: "YouTube",
      };
    }

    return {
      error: "目前仅支持 YouTube 视频链接。",
    };
  }

  function setImportBusy(busy) {
    const label = elements.submitButton.querySelector("span");
    elements.urlForm.toggleAttribute("aria-busy", busy);
    elements.submitButton.disabled = busy;
    elements.submitButton.setAttribute("aria-label", busy ? "正在打开视频" : "导入视频");
    if (label) label.textContent = busy ? "打开中" : "导入";
  }

  function syncAppViewportHeight() {
    const candidates = [
      window.innerHeight,
      window.visualViewport?.height,
      window.screen?.availHeight,
    ].filter((value) => Number.isFinite(value) && value > 0);
    const viewportHeight = Math.max(560, Math.floor(Math.min(...candidates)));
    document.documentElement.style.setProperty("--app-viewport-height", `${viewportHeight}px`);
  }

  function showWorkspace(reducedMotion) {
    const swapViews = () => {
      document.body.classList.add("workspace-active");
      elements.landingView.classList.add("is-hidden");
      elements.workspaceView.classList.remove("is-hidden");
      document.body.classList.remove("import-committing", "door-opening");
      setImportBusy(false);
      elements.aiSettingsButton.classList.remove("is-hidden");
      elements.newVideoButton.classList.remove("is-hidden");
    };

    if (!reducedMotion && typeof document.startViewTransition === "function") {
      document.documentElement.classList.add("workspace-view-transition");
      const transition = document.startViewTransition(swapViews);
      const finishTransition = () => {
        document.documentElement.classList.remove("workspace-view-transition");
      };
      transition.finished.then(finishTransition, finishTransition);
      return;
    }

    document.body.classList.add("workspace-entering");
    swapViews();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => document.body.classList.remove("workspace-entering"));
    });
  }

  async function startImport(rawUrl) {
    const source = parseVideoUrl(rawUrl);
    if (source.error) {
      showFieldError(source.error);
      return;
    }

    clearFieldError();
    if (document.body.classList.contains("import-committing")) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setImportBusy(true);
    document.body.classList.add("import-committing");
    await delay(reducedMotion ? 30 : 110);
    if (!document.body.classList.contains("import-committing")) return;
    document.body.classList.add("door-opening");
    await delay(reducedMotion ? 50 : 1080);
    if (!document.body.classList.contains("door-opening")) return;

    const token = ++state.loadToken;
    state.source = source;
    state.transcript = [];
    state.activeIndex = -1;
    state.currentTime = 0;
    state.duration = DEFAULT_DURATION;
    state.lastCaptionWord = -1;
    state.transcriptId = null;
    state.showTranslations = false;
    state.revealedTranslations.clear();
    state.translations.clear();
    state.translationErrors.clear();
    state.translationQueue.clear();
    state.translationInFlight.clear();
    state.translationControllers.forEach((controller) => controller.abort());
    state.translationControllers.clear();
    state.translationActiveBatches = 0;
    if (state.summaryController) state.summaryController.abort();
    state.summaryController = null;
    state.summaryLoading = false;
    state.summaryTranscriptId = null;
    state.analysisCache.clear();
    state.dictionaryCache.clear();
    state.phrasePointer = null;
    state.suppressWordClick = false;
    if (state.hoverLookupTimer) window.clearTimeout(state.hoverLookupTimer);
    state.hoverLookupTimer = null;
    state.hoverLookupCandidate = null;
    state.hoverLookupPoint = null;
    state.hoverLookupTarget = null;
    state.studyOverlay = null;
    state.resumeAfterStudy = false;
    if (state.translationTimer) window.clearTimeout(state.translationTimer);
    state.translationTimer = null;
    if (state.translationObserver) state.translationObserver.disconnect();
    state.simulatedPlayback = false;
    setPlaying(false);
    cleanupPlayer();
    closeTuningPopovers();
    closeDictionary({ resume: false });
    closeSentenceAnalysis({ resume: false });
    setPanelView("transcript");
    resetSummaryView();
    updateTranslationToggle();

    showWorkspace(reducedMotion);
    elements.transcriptSkeleton.classList.remove("is-hidden");
    elements.transcriptList.replaceChildren();
    elements.transcriptEmpty.classList.add("is-hidden");
    elements.transcriptSearch.value = "";
    elements.searchRow.classList.add("is-hidden");
    elements.searchResultCount.textContent = "0";
    elements.captionOverlay.classList.remove("is-visible");
    elements.captionOverlay.classList.remove("has-translation");
    elements.captionText.textContent = "当前句子会显示在这里。";
    elements.captionText.classList.remove("is-long", "is-very-long");
    elements.captionTranslation.textContent = "译文将在开启翻译后显示";
    elements.captionTranslation.classList.remove("is-loading", "has-error");
    elements.extractOverlay.classList.remove("is-complete");
    elements.extractOverlay.classList.remove("has-error");
    elements.extractProgress.style.width = "10%";
    elements.workspaceView.setAttribute("aria-busy", "true");
    setInteractiveReady(false);

    elements.projectTitle.textContent = "已导入的视频";
    elements.transcriptCount.textContent = "0";

    mountVideo(source, token);
    fetchVideoTitle(source, token);

    const transcriptPromise = resolveTranscript(source.url);
    const phases = [
      {
        progress: 28,
        title: "正在打开视频…",
        detail: "视频已就绪，正在读取语音内容。",
        wait: 290,
      },
      {
        progress: 59,
        title: "正在识别对话…",
        detail: "正在区分自然停顿、对话与背景音乐。",
        wait: 390,
      },
      {
        progress: 86,
        title: "正在校准字幕…",
        detail: "正在让每一句字幕准确跟上画面。",
        wait: 410,
      },
      {
        progress: 92,
        title: "字幕即将完成…",
        detail: "开始练习前，再检查一次时间轴。",
        wait: 300,
      },
    ];

    for (const phase of phases) {
      if (token !== state.loadToken) return;
      elements.extractTitle.textContent = phase.title;
      elements.extractDetail.textContent = phase.detail;
      elements.extractProgress.style.width = `${phase.progress}%`;
      await delay(phase.wait);
    }

    let transcriptResult;
    try {
      transcriptResult = await transcriptPromise;
    } catch (error) {
      if (token !== state.loadToken) return;
      showTranscriptionFailure(error);
      return;
    }
    if (token !== state.loadToken) return;

    state.transcript = transcriptResult.segments;
    state.transcriptId = transcriptResult.transcriptId;
    const transcriptEnd = state.transcript.length
      ? state.transcript[state.transcript.length - 1].end
      : state.duration;
    state.source.clipDuration = null;
    let fullDuration = transcriptEnd;
    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      fullDuration = Number(state.ytPlayer.getDuration()) || transcriptEnd;
    }
    state.duration = fullDuration;
    elements.transcriptCount.textContent = String(state.transcript.length);
    elements.transcriptSkeleton.classList.add("is-hidden");
    elements.workspaceView.setAttribute("aria-busy", "false");
    setInteractiveReady(true);
    renderTranscript("");
    resetSummaryView();
    updatePlaybackUI(0, true);

    elements.extractTitle.textContent = "字幕已准备好。";
    elements.extractDetail.textContent = "现在可以逐句听、循环练，跟着开口了。";
    elements.extractProgress.style.width = "100%";
    await delay(170);
    elements.extractOverlay.classList.add("is-complete");
    saveSession();
  }

  async function resolveTranscript(url) {
    const endpoint = window.VREPLY_TRANSCRIBE_ENDPOINT;
    if (endpoint) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        if (!response.ok) {
          let message = "暂时无法读取这个视频的字幕。";
          try {
            const failure = await response.json();
            if (typeof failure.error === "string") message = userMessage(failure.error, message);
            else if (failure.error && failure.error.message) message = userMessage(failure.error.message, message);
          } catch (_error) {
            // Keep the user-facing fallback message.
          }
          throw new Error(message);
        }
        const payload = await response.json();
        const segments = normalizeSegments(payload.segments);
        const transcriptId = typeof payload.transcriptId === "string" ? payload.transcriptId : null;
        if (segments.length && transcriptId) return { segments, transcriptId };
        throw new Error("这个视频没有可用的英文字幕。");
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("字幕读取时间过长，请稍后重试。");
        }
        throw error;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    throw new Error("字幕服务尚未配置。");
  }

  function normalizeSegments(segments) {
    if (!Array.isArray(segments)) return [];
    const normalized = segments
      .map((segment, index) => {
        const start = Math.max(0, Number(segment.start) || 0);
        const end = Math.max(start, Number(segment.end) || 0);
        const words = Array.isArray(segment.words)
          ? segment.words
              .map((word) => {
                const wordStart = Number(word.start);
                const wordEnd = Number(word.end);
                return {
                  text: String(word.text || "").trim(),
                  start: Number.isFinite(wordStart) ? Math.max(start, wordStart) : start,
                  end: Number.isFinite(wordEnd) ? Math.min(end, wordEnd) : end,
                };
              })
              .filter((word) => word.text && word.end > word.start)
          : [];
        return {
          id: Number(segment.id) || index + 1,
          start,
          end,
          text: String(segment.text || "").trim(),
          words,
        };
      })
      .filter((segment) => segment.text && segment.end > segment.start)
      .sort((a, b) => a.start - b.start);

    normalized.forEach((segment, index) => {
      const next = normalized[index + 1];
      if (next && next.start > segment.start && segment.end > next.start) {
        segment.end = next.start;
      }
      segment.words = segment.words
        .map((word) => ({ ...word, end: Math.min(segment.end, word.end) }))
        .filter((word) => word.start < segment.end && word.end > word.start);
    });
    return normalized;
  }

  function setInteractiveReady(ready) {
    state.interactiveReady = Boolean(ready);
    [
      elements.rewindButton,
      elements.playButton,
      elements.forwardButton,
      elements.progressRange,
      elements.speedButton,
      elements.speedRange,
      elements.volumeButton,
      elements.volumeRange,
      elements.loopButton,
      elements.followToggle,
      elements.transcriptTab,
      elements.summaryTab,
      elements.searchButton,
      elements.downloadButton,
    ].forEach((control) => {
      control.disabled = !ready;
    });
    updateTranslationToggle();
  }

  function showTranscriptionFailure(error) {
    const message = userMessage(error && error.message, "暂时无法为这个视频生成字幕。");
    state.transcript = [];
    state.transcriptId = null;
    state.activeIndex = -1;
    elements.transcriptSkeleton.classList.add("is-hidden");
    elements.transcriptCount.textContent = "0";
    elements.workspaceView.setAttribute("aria-busy", "false");
    elements.extractOverlay.classList.add("has-error");
    elements.extractProgress.style.width = "100%";
    elements.extractTitle.textContent = "字幕读取失败。";
    elements.extractDetail.textContent = message;
    setInteractiveReady(false);
    showToast("字幕暂不可用", message);
  }

  function mountVideo(source, token) {
    state.playerKind = source.kind;
    state.playerReady = false;
    elements.videoMount.replaceChildren();
    elements.videoAmbient.style.backgroundImage = source.kind === "youtube"
      ? `linear-gradient(rgba(8, 12, 9, 0.44), rgba(8, 12, 9, 0.74)), url("https://i.ytimg.com/vi/${source.id}/maxresdefault.jpg")`
      : "";
    elements.videoPlaceholder.classList.remove("is-hidden");

    if (source.kind === "direct") {
      const video = document.createElement("video");
      video.src = source.url;
      video.preload = "metadata";
      video.playsInline = true;
      video.volume = state.volume / 100;
      video.setAttribute("aria-label", "已导入的视频");
      video.addEventListener("loadedmetadata", () => {
        if (token !== state.loadToken) return;
        state.playerReady = true;
        state.duration = Number.isFinite(video.duration) ? video.duration : state.duration;
        elements.videoPlaceholder.classList.add("is-hidden");
        updatePlaybackUI(state.currentTime, true);
      });
      video.addEventListener("play", () => setPlaying(true));
      video.addEventListener("pause", () => setPlaying(false));
      video.addEventListener("ended", () => setPlaying(false));
      video.addEventListener("error", handlePlayerError);
      elements.videoMount.appendChild(video);
      state.directPlayer = video;
      return;
    }

    const host = document.createElement("div");
    host.id = `youtube-player-${token}`;
    elements.videoMount.appendChild(host);

    loadYouTubeApi()
      .then(() => {
        if (token !== state.loadToken || !window.YT || !window.YT.Player) return;
        state.ytPlayer = new window.YT.Player(host.id, {
          videoId: source.id,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 0,
            cc_load_policy: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady(event) {
              if (token !== state.loadToken) return;
              state.playerReady = true;
              state.simulatedPlayback = false;
              state.duration = source.clipDuration || Number(event.target.getDuration()) || state.duration;
              event.target.setPlaybackRate(state.speed);
              event.target.setVolume(state.volume);
              disableYouTubeCaptions(event.target);
              elements.videoPlaceholder.classList.add("is-hidden");
              updatePlaybackUI(state.currentTime, true);
            },
            onStateChange(event) {
              if (!window.YT || token !== state.loadToken) return;
              setPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
            onApiChange(event) {
              disableYouTubeCaptions(event.target);
            },
            onError: handlePlayerError,
          },
        });
      })
      .catch(handlePlayerError);
  }

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (youTubeApiPromise) return youTubeApiPromise;

    youTubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousReady === "function") previousReady();
        resolve(window.YT);
      };

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) return;

      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("YouTube 播放器加载失败"));
      document.head.appendChild(script);
    });

    return youTubeApiPromise;
  }

  function disableYouTubeCaptions(player) {
    if (!player || typeof player.setOption !== "function") return;
    try {
      player.setOption("captions", "track", {});
    } catch (_error) {
      // Caption modules load asynchronously; onApiChange retries when ready.
    }
  }

  async function fetchVideoTitle(source, token) {
    if (source.kind !== "youtube") return;
    try {
      const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(source.url)}&format=json`;
      const response = await fetch(endpoint);
      if (!response.ok) return;
      const data = await response.json();
      if (token === state.loadToken && data.title) {
        elements.projectTitle.textContent = String(data.title);
      }
    } catch (_error) {
      // A title is optional; playback and transcript still work without it.
    }
  }

  function handlePlayerError() {
    state.playerReady = false;
    state.simulatedPlayback = true;
    elements.videoPlaceholder.classList.remove("is-hidden");
    showToast("已切换为字幕练习", "视频预览受限，但仍可通过字幕时间轴继续练习。");
  }

  function cleanupPlayer() {
    if (state.ytPlayer && typeof state.ytPlayer.destroy === "function") {
      try {
        state.ytPlayer.destroy();
      } catch (_error) {
        // The iframe may already have been removed.
      }
    }
    if (state.directPlayer) {
      state.directPlayer.pause();
      state.directPlayer.removeAttribute("src");
      state.directPlayer.load();
    }
    state.ytPlayer = null;
    state.directPlayer = null;
    state.playerReady = false;
  }

  function togglePlay() {
    if (!state.source || !state.transcript.length) return;

    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      if (state.playing) state.ytPlayer.pauseVideo();
      else state.ytPlayer.playVideo();
      return;
    }

    if (state.playerKind === "direct" && state.playerReady && state.directPlayer) {
      if (state.directPlayer.paused) state.directPlayer.play().catch(handlePlayerError);
      else state.directPlayer.pause();
      return;
    }

    state.simulatedPlayback = true;
    state.lastTickAt = performance.now();
    setPlaying(!state.playing);
  }

  function setPlaying(playing) {
    state.playing = Boolean(playing);
    elements.playButton.classList.toggle("is-playing", state.playing);
    elements.playButton.setAttribute("aria-label", state.playing ? "暂停视频" : "播放视频");
    elements.playButton.dataset.controlTooltip = state.playing ? "暂停" : "播放";
  }

  function pausePlayback() {
    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      state.ytPlayer.pauseVideo();
    } else if (state.playerKind === "direct" && state.playerReady && state.directPlayer) {
      state.directPlayer.pause();
    }
    setPlaying(false);
  }

  function resumePlayback() {
    if (!state.source || !state.transcript.length) return;
    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      state.ytPlayer.playVideo();
      setPlaying(true);
    } else if (state.playerKind === "direct" && state.playerReady && state.directPlayer) {
      state.directPlayer.play().catch(handlePlayerError);
      setPlaying(true);
    } else {
      state.simulatedPlayback = true;
      state.lastTickAt = performance.now();
      setPlaying(true);
    }
  }

  function beginStudyOverlay(type) {
    if (!state.studyOverlay) {
      state.resumeAfterStudy = state.playing;
      pausePlayback();
    }
    state.studyOverlay = type;
  }

  function endStudyOverlay(type, options) {
    if (state.studyOverlay !== type) return;
    if (options && options.preserveStudySession) return;
    const shouldResume = state.resumeAfterStudy && !(options && options.resume === false);
    state.studyOverlay = null;
    if (state.hoverLookupTarget && type !== "lookup-hover") {
      state.studyOverlay = "lookup-hover";
      return;
    }
    state.resumeAfterStudy = false;
    if (shouldResume) resumePlayback();
  }

  function closeStudyOverlayForPlayback() {
    if (!elements.dictionaryCard.classList.contains("is-hidden")) closeDictionary({ resume: false });
    if (!elements.analysisCard.classList.contains("is-hidden")) closeSentenceAnalysis({ resume: false });
  }

  function seekTo(value, options) {
    const config = options || {};
    const nextTime = Math.max(0, Math.min(Number(value) || 0, state.duration || 0));
    state.currentTime = nextTime;

    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      state.ytPlayer.seekTo(nextTime, true);
      if (config.play) state.ytPlayer.playVideo();
    } else if (state.playerKind === "direct" && state.playerReady && state.directPlayer) {
      state.directPlayer.currentTime = nextTime;
      if (config.play) state.directPlayer.play().catch(handlePlayerError);
    } else if (config.play) {
      state.simulatedPlayback = true;
      state.lastTickAt = performance.now();
      setPlaying(true);
    }

    updatePlaybackUI(nextTime, true);
  }

  function tickPlayback() {
    const now = performance.now();
    const elapsed = Math.max(0, (now - state.lastTickAt) / 1000);
    state.lastTickAt = now;

    let current = state.currentTime;
    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      try {
        current = Number(state.ytPlayer.getCurrentTime()) || 0;
        const playerDuration = Number(state.ytPlayer.getDuration());
        if (!state.source.clipDuration && playerDuration > 0) state.duration = playerDuration;
      } catch (_error) {
        // Player is between states; keep the last known timeline position.
      }
    } else if (state.playerKind === "direct" && state.playerReady && state.directPlayer) {
      current = Number(state.directPlayer.currentTime) || 0;
    } else if (state.simulatedPlayback && state.playing) {
      current += elapsed * state.speed;
    }

    if (state.loopLine && state.playing && state.activeIndex >= 0) {
      const activeSegment = state.transcript[state.activeIndex];
      if (activeSegment && current >= activeSegment.end - 0.04) {
        seekTo(activeSegment.start, { play: true });
        return;
      }
    }

    if (current >= state.duration && state.duration > 0) {
      current = state.duration;
      if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
        state.ytPlayer.pauseVideo();
      }
      setPlaying(false);
    }

    state.currentTime = current;
    updatePlaybackUI(current, false);
  }

  function updatePlaybackUI(time, force) {
    const duration = Math.max(0.1, state.duration || 0.1);
    const progress = Math.max(0, Math.min(100, (time / duration) * 100));
    elements.currentTime.textContent = formatTime(time);
    elements.durationTime.textContent = formatTime(duration);
    elements.progressRange.max = String(duration);
    elements.progressRange.value = String(Math.min(time, duration));
    elements.progressFill.style.width = `${progress}%`;
    if (!state.timelineHovering) updateProgressTooltip(time, progress);

    if (!state.transcript.length) return;
    const nextIndex = findActiveSegment(time);
    if (force || nextIndex !== state.activeIndex) setActiveSegment(nextIndex);
    updateCaptionWord(time);
  }

  function updateProgressTooltip(time, progress) {
    const percent = Number.isFinite(progress)
      ? progress
      : Math.max(0, Math.min(100, ((Number(time) || 0) / Math.max(0.1, state.duration || 0.1)) * 100));
    elements.progressTooltip.textContent = formatTime(time);
    elements.progressTooltip.style.left = `${percent}%`;
  }

  function previewTimelineAt(clientX) {
    const rect = elements.progressRange.getBoundingClientRect();
    if (!rect.width) return;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    updateProgressTooltip(ratio * Math.max(0, state.duration || 0), ratio * 100);
  }

  function findActiveSegment(time) {
    for (let index = state.transcript.length - 1; index >= 0; index -= 1) {
      const segment = state.transcript[index];
      if (time >= segment.start && time < segment.end) return index;
      if (segment.start <= time) break;
    }
    return -1;
  }

  function setActiveSegment(index) {
    if (index !== state.activeIndex && !elements.analysisCard.classList.contains("is-hidden")) {
      closeSentenceAnalysis();
    }
    const changed = index !== state.activeIndex;
    const previous = elements.transcriptList.querySelector(".transcript-item.is-active");
    if (previous) {
      previous.classList.remove("is-active");
      previous.removeAttribute("aria-current");
    }

    if (index < 0 || !state.transcript[index]) {
      state.activeIndex = -1;
      state.lastCaptionWord = -1;
      elements.captionOverlay.classList.remove("is-visible");
      elements.captionOverlay.classList.remove("has-translation");
      elements.captionTranslation.textContent = "译文将在开启翻译后显示";
      elements.captionTranslation.classList.remove("is-loading", "has-error");
      return;
    }

    state.activeIndex = index;
    state.lastCaptionWord = -1;
    const item = elements.transcriptList.querySelector(`.transcript-item[data-index="${index}"]`);
    if (item) {
      item.classList.add("is-active");
      item.setAttribute("aria-current", "true");
      if (changed) {
        item.classList.add("is-entering");
        item.addEventListener("animationend", () => item.classList.remove("is-entering"), { once: true });
      }
      if (state.autoFollow && !elements.transcriptSearch.value.trim()) {
        item.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    const segment = state.transcript[index];
    elements.captionOverlay.classList.add("is-visible");
    renderCaptionWords(segment);
    updateCaptionTranslation(index);
  }

  function normalizePhraseToken(value) {
    return String(value || "")
      .toLocaleLowerCase("en")
      .replace(/[’]/g, "'")
      .match(/[a-z]+(?:'[a-z]+)*/u)?.[0] || "";
  }

  function commonPhraseRanges(values) {
    const tokens = values.map(normalizePhraseToken);
    const ranges = new Map();
    for (let index = 0; index < tokens.length; index += 1) {
      if (!tokens[index]) continue;
      const match = COMMON_PHRASE_ENTRIES.find((entry) => (
        index + entry.tokens.length <= tokens.length
        && entry.tokens.every((token, offset) => token === tokens[index + offset])
      ));
      if (!match) continue;
      ranges.set(index, { end: index + match.tokens.length - 1, phrase: match.phrase });
      index += match.tokens.length - 1;
    }
    return ranges;
  }

  function makeCaptionWord(word, index, total, interactive = true) {
    const span = document.createElement("span");
    span.className = "caption-word";
    if (/\d/u.test(String(word.text || ""))) span.classList.add("is-numeric");
    span.dataset.word = String(index);
    span.dataset.start = String(word.start);
    span.dataset.end = String(word.end);
    const selection = String(word.text || "").match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/u)?.[0] || "";
    if (selection && interactive) {
      span.dataset.selection = selection;
      span.dataset.index = String(state.activeIndex);
      span.tabIndex = 0;
      span.setAttribute("role", "button");
      span.setAttribute("aria-label", `查询 ${selection} 的释义`);
    }
    span.textContent = index === total - 1 ? word.text : `${word.text} `;
    return span;
  }

  function renderCaptionWords(segment) {
    if (
      (state.hoverLookupTarget && elements.captionText.contains(state.hoverLookupTarget))
      || (state.hoverLookupCandidate && elements.captionText.contains(state.hoverLookupCandidate))
    ) clearHoverLookup();
    elements.captionText.replaceChildren();
    const captionLength = String(segment.text || "").length;
    elements.captionText.classList.toggle("is-long", captionLength > 105);
    elements.captionText.classList.toggle("is-very-long", captionLength > 165);
    const fallbackTokens = String(segment.text).split(/\s+/).filter(Boolean);
    const duration = segment.end - segment.start;
    const words = segment.words.length === fallbackTokens.length
      ? segment.words
      : fallbackTokens.map((text, index) => ({
          text,
          start: segment.start + (duration * index) / fallbackTokens.length,
          end: segment.start + (duration * (index + 1)) / fallbackTokens.length,
        }));

    const phraseRanges = commonPhraseRanges(words.map((word) => word.text));
    for (let index = 0; index < words.length; index += 1) {
      const phraseRange = phraseRanges.get(index);
      if (!phraseRange) {
        elements.captionText.appendChild(makeCaptionWord(words[index], index, words.length));
        continue;
      }
      const phrase = document.createElement("span");
      phrase.className = "caption-phrase";
      phrase.dataset.selection = phraseRange.phrase;
      phrase.dataset.index = String(state.activeIndex);
      phrase.tabIndex = 0;
      phrase.setAttribute("role", "button");
      phrase.setAttribute("aria-label", `查询短语 ${phraseRange.phrase} 的释义`);
      for (let wordIndex = index; wordIndex <= phraseRange.end; wordIndex += 1) {
        phrase.appendChild(makeCaptionWord(words[wordIndex], wordIndex, words.length, false));
      }
      elements.captionText.appendChild(phrase);
      index = phraseRange.end;
    }
  }

  function updateCaptionWord(time) {
    const segment = state.transcript[state.activeIndex];
    if (!segment) return;
    const words = elements.captionText.querySelectorAll(".caption-word");
    if (!words.length) return;
    let wordIndex = -1;
    let spokenCount = 0;
    words.forEach((word, index) => {
      const start = Number(word.dataset.start);
      const end = Number(word.dataset.end);
      if (time >= end) spokenCount = index + 1;
      if (time >= start && time < end) wordIndex = index;
    });
    const captionState = `${wordIndex}:${spokenCount}`;
    if (captionState === state.lastCaptionWord) return;
    state.lastCaptionWord = captionState;
    words.forEach((word, index) => {
      word.classList.toggle("is-spoken", index < spokenCount);
      word.classList.toggle("is-current", index === wordIndex);
    });
  }

  function renderTranscript(query) {
    if (
      (state.hoverLookupTarget && elements.transcriptList.contains(state.hoverLookupTarget))
      || (state.hoverLookupCandidate && elements.transcriptList.contains(state.hoverLookupCandidate))
    ) clearHoverLookup();
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const fragment = document.createDocumentFragment();
    let resultCount = 0;

    state.transcript.forEach((segment, index) => {
      if (normalizedQuery && !segment.text.toLowerCase().includes(normalizedQuery)) return;
      resultCount += 1;

      const item = document.createElement("article");
      item.className = "transcript-item";
      item.dataset.index = String(index);
      if (index === state.activeIndex) {
        item.classList.add("is-active");
        item.setAttribute("aria-current", "true");
      }

      const time = document.createElement("button");
      time.type = "button";
      time.className = "line-time";
      time.textContent = shortTime(segment.start);
      time.setAttribute("aria-label", `从 ${formatTime(segment.start)} 播放第 ${index + 1} 句`);

      const content = document.createElement("div");
      content.className = "line-content";

      const copy = document.createElement("p");
      copy.className = "line-copy";
      appendLookupWords(copy, segment.text, index);

      const translation = document.createElement("button");
      translation.type = "button";
      translation.className = "line-translation";
      translation.dataset.index = String(index);
      const translationText = document.createElement("span");
      translationText.className = "translation-text";
      translation.appendChild(translationText);
      updateTranslationNode(translation, index);
      content.append(copy, translation);

      item.append(time, content);
      fragment.appendChild(item);
    });

    elements.transcriptList.replaceChildren(fragment);
    elements.searchResultCount.textContent = String(resultCount);
    elements.transcriptEmpty.classList.toggle("is-hidden", resultCount > 0);
    resetTranslationObserver();
  }

  function jumpSentence(direction) {
    if (!state.transcript.length) return;
    let currentIndex = state.activeIndex;
    if (currentIndex < 0) {
      currentIndex = state.transcript.findIndex((segment) => segment.start > state.currentTime) - 1;
      if (currentIndex < 0 && state.currentTime >= state.transcript[0].start) currentIndex = 0;
    }
    const targetIndex = Math.max(0, Math.min(state.transcript.length - 1, currentIndex + direction));
    seekTo(state.transcript[targetIndex].start, { play: state.playing });
  }

  function resetSummaryView() {
    elements.summaryView.classList.remove("is-loading", "has-error");
    elements.summaryTopics.replaceChildren();
    elements.summaryPoints.replaceChildren();
    elements.summaryTitle.textContent = "视频内容简介";
    elements.summaryOverview.textContent = "打开此页面后，将使用已配置的模型 API 总结视频内容。";
    elements.summaryRetryButton.classList.add("is-hidden");
    elements.summaryRetryButton.textContent = "重新生成";
  }

  function renderAiSummary(summary) {
    elements.summaryView.classList.remove("is-loading", "has-error");
    elements.summaryTopics.replaceChildren();
    elements.summaryPoints.replaceChildren();
    elements.summaryRetryButton.classList.add("is-hidden");
    elements.summaryTitle.textContent = summary.title || "视频内容速览";
    elements.summaryOverview.textContent = summary.overview || "模型未返回视频概括。";

    (summary.topics || []).forEach((topic) => {
      const chip = document.createElement("span");
      chip.textContent = topic;
      elements.summaryTopics.appendChild(chip);
    });

    (summary.points || []).forEach((item, order) => {
      const index = state.transcript.findIndex((segment) => segment.id === item.segmentId);
      if (index < 0) return;
      const segment = state.transcript[index];
      const point = document.createElement("button");
      point.type = "button";
      point.className = "summary-point";
      point.dataset.index = String(index);
      point.setAttribute("aria-label", `从 ${formatTime(segment.start)} 播放：${item.heading}`);

      const meta = document.createElement("span");
      meta.className = "summary-point-meta";
      const number = document.createElement("b");
      number.textContent = String(order + 1).padStart(2, "0");
      const time = document.createElement("i");
      time.textContent = shortTime(segment.start);
      meta.append(number, time);
      const copy = document.createElement("span");
      copy.className = "summary-point-copy";
      const heading = document.createElement("strong");
      heading.textContent = item.heading;
      const detail = document.createElement("span");
      detail.textContent = item.text;
      copy.append(heading, detail);
      point.append(meta, copy);
      elements.summaryPoints.appendChild(point);
    });
  }

  function showSummaryError(message) {
    elements.summaryView.classList.remove("is-loading");
    elements.summaryView.classList.add("has-error");
    elements.summaryTopics.replaceChildren();
    elements.summaryPoints.replaceChildren();
    elements.summaryTitle.textContent = "暂时无法生成简介";
    elements.summaryOverview.textContent = message;
    elements.summaryRetryButton.classList.remove("is-hidden");
  }

  async function loadAiSummary() {
    if (!state.interactiveReady || !state.transcriptId || state.summaryLoading) return;
    if (state.summaryTranscriptId === state.transcriptId) return;
    if (!state.languageAvailable) {
      showSummaryError("配置 AI 模型后即可生成。");
      elements.summaryTitle.textContent = "尚未配置模型";
      elements.summaryRetryButton.textContent = "去配置";
      return;
    }

    const controller = new AbortController();
    state.summaryController = controller;
    state.summaryLoading = true;
    const token = state.loadToken;
    const transcriptId = state.transcriptId;
    elements.summaryView.classList.add("is-loading");
    elements.summaryView.classList.remove("has-error");
    elements.summaryRetryButton.classList.add("is-hidden");
    elements.summaryRetryButton.textContent = "重新生成";
    elements.summaryTitle.textContent = "正在总结视频…";
    elements.summaryOverview.textContent = "正在使用设置中的模型读取字幕并生成中文概括。";
    elements.summaryTopics.replaceChildren();
    elements.summaryPoints.replaceChildren();

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptId, targetLanguage: "zh-CN" }),
        signal: controller.signal,
      });
      const payload = await readApiPayload(response, "视频内容总结暂时不可用，请稍后重试。");
      if (token !== state.loadToken || controller.signal.aborted || transcriptId !== state.transcriptId) return;
      state.summaryTranscriptId = transcriptId;
      renderAiSummary(payload.summary || {});
    } catch (error) {
      if (error.name !== "AbortError" && token === state.loadToken) showSummaryError(error.message);
    } finally {
      if (state.summaryController === controller) state.summaryController = null;
      state.summaryLoading = false;
    }
  }

  function setPanelView(view) {
    const showSummary = view === "summary";
    state.panelView = showSummary ? "summary" : "transcript";
    elements.transcriptTab.classList.toggle("is-active", !showSummary);
    elements.summaryTab.classList.toggle("is-active", showSummary);
    elements.transcriptTab.setAttribute("aria-selected", String(!showSummary));
    elements.summaryTab.setAttribute("aria-selected", String(showSummary));
    elements.transcriptTab.tabIndex = showSummary ? -1 : 0;
    elements.summaryTab.tabIndex = showSummary ? 0 : -1;
    elements.transcriptScroll.classList.toggle("is-hidden", showSummary);
    elements.summaryView.classList.toggle("is-hidden", !showSummary);
    elements.transcriptPanel.classList.toggle("is-summary", showSummary);
    elements.transcriptPanel.setAttribute("aria-label", showSummary ? "视频内容简介" : "逐句字幕");
    if (showSummary) {
      closeDictionary();
      loadAiSummary();
    }
  }

  function appendLookupWords(container, text, lineIndex) {
    const value = String(text || "");
    let parts = [];
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("en", { granularity: "word" });
      parts = Array.from(segmenter.segment(value)).map((part) => ({
        text: part.segment,
        isWordLike: Boolean(part.isWordLike),
      }));
    } else {
      parts = (value.match(/\s+|[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*|[^\s]/gu) || [])
        .map((part) => ({ text: part, isWordLike: /[\p{L}\p{N}]/u.test(part) }));
    }

    const wordPositions = parts.reduce((positions, part, index) => {
      if (part.isWordLike) positions.push(index);
      return positions;
    }, []);
    const phraseRanges = commonPhraseRanges(wordPositions.map((index) => parts[index].text));
    const phrasesByPart = new Map();
    phraseRanges.forEach((range, wordIndex) => {
      phrasesByPart.set(wordPositions[wordIndex], {
        end: wordPositions[range.end],
        phrase: range.phrase,
      });
    });

    for (let index = 0; index < parts.length; index += 1) {
      const range = phrasesByPart.get(index);
      if (!range) {
        appendLookupPart(container, parts[index].text, parts[index].isWordLike, lineIndex);
        continue;
      }
      const phrase = document.createElement("span");
      phrase.className = "line-phrase";
      phrase.dataset.index = String(lineIndex);
      phrase.dataset.selection = range.phrase;
      phrase.tabIndex = 0;
      phrase.setAttribute("role", "button");
      phrase.setAttribute("aria-label", `查询短语 ${range.phrase} 的释义`);
      for (let partIndex = index; partIndex <= range.end; partIndex += 1) {
        appendLookupPart(
          phrase,
          parts[partIndex].text,
          parts[partIndex].isWordLike,
          lineIndex
        );
      }
      container.appendChild(phrase);
      index = range.end;
    }
  }

  function appendLookupPart(container, text, isWordLike, lineIndex) {
    if (!isWordLike) {
      container.appendChild(document.createTextNode(text));
      return;
    }
    const word = document.createElement("span");
    word.className = "line-word";
    if (/\d/u.test(text)) word.classList.add("is-numeric");
    word.dataset.index = String(lineIndex);
    word.dataset.selection = text;
    word.textContent = text;
    container.appendChild(word);
  }

  function translationEngineAvailable() {
    if (state.translationEngine === "api") return state.languageAvailable;
    return !["checking", "unavailable"].includes(state.chromeTranslationAvailability);
  }

  function chromeAvailabilityText() {
    if (!("Translator" in self) || state.chromeTranslationAvailability === "unavailable") {
      return "当前浏览器不支持，请使用桌面版 Chrome 138 或更高版本。";
    }
    if (state.chromeTranslationAvailability === "checking") return "正在检查浏览器支持情况…";
    if (state.chromeTranslationAvailability === "downloading") {
      return `正在下载中英语言包… ${state.chromeDownloadProgress}%`;
    }
    if (state.chromeTranslationAvailability === "downloadable") {
      return "可以使用，首次翻译时会下载语言包。";
    }
    if (state.chromeTranslationAvailability === "error") {
      return "语言包准备失败，请重新点击翻译。";
    }
    return "已就绪，字幕内容只在当前浏览器中处理。";
  }

  function syncTranslationSettingsForm(engine = state.translationEngine) {
    elements.translationEngineChrome.checked = engine === "chrome";
    elements.translationEngineApi.checked = engine === "api";
    elements.chromeEngineOption.classList.toggle(
      "is-unavailable",
      state.chromeTranslationAvailability === "unavailable"
    );
    elements.chromeTranslationStatus.textContent = chromeAvailabilityText();
    elements.apiSettingsFields.classList.toggle("is-secondary", engine !== "api");
    elements.aiCapabilitySection.classList.toggle("is-required", engine === "api");
    elements.aiCapabilitySection.classList.toggle("is-configured", state.languageAvailable);
    elements.aiRequirementBadge.textContent = state.languageAvailable
      ? "已连接"
      : engine === "api" ? "翻译必需" : "按需配置";
    elements.aiBaseUrl.required = engine === "api";
    elements.aiModel.required = engine === "api";
  }

  function updateTranslationToggle() {
    const available = translationEngineAvailable();
    const enabled = state.interactiveReady && available && Boolean(state.transcriptId);
    elements.translationToggle.disabled = !enabled;
    elements.translationToggle.classList.toggle("is-active", state.showTranslations);
    elements.translationToggle.setAttribute("aria-pressed", String(state.showTranslations));
    updateTranslationProgress();
    if (state.translationEngine === "chrome") {
      elements.translationToggle.removeAttribute("title");
      elements.translationToggle.dataset.hint = available
        ? "双语对照 · Chrome 本地翻译"
        : "请先在设置中启用翻译";
      elements.languageStatus.textContent = `Chrome 内置翻译：${chromeAvailabilityText()}`;
    } else {
      elements.translationToggle.removeAttribute("title");
      elements.translationToggle.dataset.hint = state.languageAvailable
        ? "双语对照 · 模型翻译"
        : "请先在设置中配置模型";
      elements.languageStatus.textContent = state.languageAvailable
        ? "自定义 API 翻译已就绪。"
        : "API 翻译尚未配置，请打开设置。";
    }
    elements.chromeTranslationStatus.textContent = chromeAvailabilityText();
    elements.chromeEngineOption.classList.toggle(
      "is-unavailable",
      state.chromeTranslationAvailability === "unavailable"
    );
  }

  function updateTranslationProgress() {
    const total = state.transcript.length;
    const finished = Math.min(total, state.translations.size + state.translationErrors.size);
    const percent = total ? Math.round((finished / total) * 100) : 0;
    const translating = state.showTranslations && total > 0 && finished < total;
    elements.translationProgress.textContent = translating ? `字幕翻译进度 ${percent}%` : "";
    elements.translationToggle.classList.toggle("is-translating", translating);
    if (translating) {
      const failed = state.translationErrors.size;
      elements.translationToggle.setAttribute(
        "aria-label",
        failed
          ? `整篇字幕翻译进度 ${percent}%，${failed} 句暂时失败`
          : `整篇字幕翻译进度 ${percent}%`
      );
    } else {
      elements.translationToggle.setAttribute(
        "aria-label",
        state.showTranslations ? "隐藏全部字幕译文" : "显示全部字幕译文"
      );
    }
  }

  function updateTranslationNode(node, index) {
    const revealed = state.showTranslations || state.revealedTranslations.has(index);
    const translation = state.translations.get(index);
    const error = state.translationErrors.get(index);
    const loading = state.translationQueue.has(index) || state.translationInFlight.has(index);
    const text = node.querySelector(".translation-text");
    node.classList.toggle("is-revealed", revealed);
    node.classList.toggle("is-loading", loading);
    node.classList.toggle("has-error", Boolean(error));
    node.disabled = state.showTranslations;
    node.setAttribute("aria-expanded", String(revealed));
    node.setAttribute(
      "aria-label",
      state.showTranslations
        ? `第 ${index + 1} 句译文已显示`
        : `${revealed ? "隐藏" : "显示"}第 ${index + 1} 句译文`
    );
    text.setAttribute("aria-hidden", String(!revealed));
    if (translation) text.textContent = translation.text;
    else if (error) text.textContent = error;
    else if (loading) {
      text.textContent = state.translationEngine === "chrome"
        ? "正在使用 Chrome 本地翻译…"
        : "正在结合语境翻译…";
    }
    else text.textContent = "点击显示译文";
  }

  function updateTranslationNodes(index) {
    elements.transcriptList
      .querySelectorAll(`.line-translation[data-index="${index}"]`)
      .forEach((node) => updateTranslationNode(node, index));
    if (index === state.activeIndex) updateCaptionTranslation(index);
  }

  function updateCaptionTranslation(index) {
    const visible = state.showTranslations || state.revealedTranslations.has(index);
    const translation = state.translations.get(index);
    const error = state.translationErrors.get(index);
    const loading = state.translationQueue.has(index) || state.translationInFlight.has(index);
    elements.captionOverlay.classList.toggle("has-translation", visible);
    elements.captionTranslation.classList.toggle("is-loading", loading);
    elements.captionTranslation.classList.toggle("has-error", Boolean(error));
    if (translation) elements.captionTranslation.textContent = translation.text;
    else if (error) elements.captionTranslation.textContent = "译文暂时不可用";
    else if (loading) elements.captionTranslation.textContent = "正在生成译文…";
    else elements.captionTranslation.textContent = "译文将在开启翻译后显示";
  }

  function resetTranslationObserver() {
    if (state.translationObserver) state.translationObserver.disconnect();
    if (!("IntersectionObserver" in window)) return;
    state.translationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.dataset.index);
          if (state.showTranslations || state.revealedTranslations.has(index)) queueTranslation(index);
        });
      },
      { root: elements.transcriptScroll, rootMargin: "120px 0px", threshold: 0.01 }
    );
    elements.transcriptList
      .querySelectorAll(".line-translation")
      .forEach((node) => state.translationObserver.observe(node));
  }

  async function detectChromeTranslationAvailability() {
    if (!("Translator" in self)) {
      state.chromeTranslationAvailability = "unavailable";
      if (state.translationEngine === "chrome") setTranslationEngine("api");
      updateTranslationToggle();
      return;
    }
    try {
      state.chromeTranslationAvailability = await self.Translator.availability({
        sourceLanguage: "en",
        targetLanguage: "zh",
      });
    } catch (_error) {
      state.chromeTranslationAvailability = "error";
    }
    updateTranslationToggle();
  }

  async function ensureChromeTranslator() {
    if (state.chromeTranslator) return state.chromeTranslator;
    if (!("Translator" in self) || state.chromeTranslationAvailability === "unavailable") {
      throw new Error("此浏览器不支持内置翻译，请使用桌面版 Chrome 138 或更高版本，或切换为 API 翻译。");
    }
    if (state.chromeTranslatorPromise) return state.chromeTranslatorPromise;

    state.chromeTranslationAvailability = "downloading";
    state.chromeDownloadProgress = 0;
    updateTranslationToggle();
    showToast("正在准备 Chrome 翻译", "首次使用需要下载中英语言包，请稍候。");
    state.chromeTranslatorPromise = self.Translator.create({
      sourceLanguage: "en",
      targetLanguage: "zh",
      monitor(monitor) {
        monitor.addEventListener("downloadprogress", (event) => {
          state.chromeDownloadProgress = Math.round(Number(event.loaded || 0) * 100);
          updateTranslationToggle();
        });
      },
    });
    try {
      state.chromeTranslator = await state.chromeTranslatorPromise;
      state.chromeTranslationAvailability = "available";
      state.chromeDownloadProgress = 100;
      updateTranslationToggle();
      return state.chromeTranslator;
    } catch (_error) {
      state.chromeTranslationAvailability = "error";
      updateTranslationToggle();
      throw new Error("Chrome 中英翻译语言包准备失败，请检查网络后重试，或切换为 API 翻译。");
    } finally {
      state.chromeTranslatorPromise = null;
    }
  }

  function cancelPendingTranslationWork() {
    state.translationControllers.forEach((controller) => controller.abort());
    state.translationControllers.clear();
    state.translationActiveBatches = 0;
    if (state.translationTimer) window.clearTimeout(state.translationTimer);
    state.translationTimer = null;
    state.translationQueue.clear();
    state.translationInFlight.clear();
    state.translationErrors.clear();
    elements.transcriptList.querySelectorAll(".line-translation").forEach((node) => {
      updateTranslationNode(node, Number(node.dataset.index));
    });
    if (state.activeIndex >= 0) updateCaptionTranslation(state.activeIndex);
    updateTranslationProgress();
  }

  function setTranslationEngine(engine) {
    if (engine !== "chrome" && engine !== "api") return;
    if (state.translationEngine !== engine) {
      state.translationEngine = engine;
      cancelPendingTranslationWork();
      if (state.showTranslations && state.translations.size < state.transcript.length) {
        prepareTranslationEngine().then((ready) => {
          if (!ready || state.translationEngine !== engine || !state.showTranslations) return;
          state.transcript.forEach((_segment, index) => queueTranslation(index));
        });
      }
    }
    try {
      localStorage.setItem(TRANSLATION_ENGINE_KEY, engine);
    } catch (_error) {
      // The choice still works for the current page session.
    }
    updateTranslationToggle();
  }

  async function prepareTranslationEngine() {
    if (state.translationEngine === "chrome") {
      try {
        await ensureChromeTranslator();
        return true;
      } catch (error) {
        showToast("Chrome 翻译不可用", error.message);
        return false;
      }
    }
    if (!state.languageAvailable) {
      showToast("API 翻译尚未配置", "请在设置中填写模型 API 信息。");
      return false;
    }
    return true;
  }

  async function revealTranslation(index) {
    if (!(await prepareTranslationEngine())) return;
    if (state.revealedTranslations.has(index) && !state.showTranslations) {
      state.revealedTranslations.delete(index);
    } else {
      state.revealedTranslations.add(index);
      queueTranslation(index);
    }
    updateTranslationNodes(index);
  }

  async function toggleTranslations() {
    if (!state.interactiveReady || !(await prepareTranslationEngine())) return;
    state.showTranslations = !state.showTranslations;
    updateTranslationToggle();
    elements.transcriptList.querySelectorAll(".line-translation").forEach((node) => {
      const index = Number(node.dataset.index);
      updateTranslationNode(node, index);
    });
    if (state.showTranslations) {
      state.transcript.forEach((_segment, index) => queueTranslation(index));
    }
    if (state.activeIndex >= 0) updateCaptionTranslation(state.activeIndex);
  }

  function queueTranslation(index) {
    if (
      !translationEngineAvailable()
      || !state.transcriptId
      || !state.transcript[index]
      || state.translations.has(index)
      || state.translationInFlight.has(index)
    ) return;
    state.translationErrors.delete(index);
    state.translationQueue.add(index);
    updateTranslationNodes(index);
    updateTranslationProgress();
    const maxConcurrentBatches = state.translationEngine === "api" ? 2 : 1;
    if (state.translationTimer || state.translationActiveBatches >= maxConcurrentBatches) return;
    state.translationTimer = window.setTimeout(flushTranslationQueue, 45);
  }

  async function flushTranslationQueue() {
    state.translationTimer = null;
    const maxConcurrentBatches = state.translationEngine === "api" ? 2 : 1;
    if (state.translationActiveBatches >= maxConcurrentBatches) return;
    const indices = Array.from(state.translationQueue).slice(0, 20);
    indices.forEach((index) => {
      state.translationQueue.delete(index);
      state.translationInFlight.add(index);
      updateTranslationNodes(index);
    });
    if (!indices.length) return;
    state.translationActiveBatches += 1;
    const token = state.loadToken;
    const transcriptId = state.transcriptId;
    const engine = state.translationEngine;
    const controller = engine === "api" ? new AbortController() : null;
    if (controller) state.translationControllers.add(controller);
    if (state.translationQueue.size && state.translationActiveBatches < maxConcurrentBatches) {
      state.translationTimer = window.setTimeout(flushTranslationQueue, 0);
    }
    try {
      if (engine === "chrome") {
        const translator = state.chromeTranslator;
        if (!translator) throw new Error("Chrome 内置翻译尚未准备好，请重新点击译文。");
        for (const index of indices) {
          const translatedText = String(await translator.translate(state.transcript[index].text) || "").trim();
          if (token !== state.loadToken || transcriptId !== state.transcriptId || engine !== state.translationEngine) return;
          if (!translatedText) throw new Error("Chrome 没有返回该句的翻译，请稍后重试。");
          state.translations.set(index, { text: translatedText, note: "" });
          state.translationErrors.delete(index);
          updateTranslationNodes(index);
          updateTranslationProgress();
        }
      } else {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcriptId: state.transcriptId,
            segmentIds: indices.map((index) => state.transcript[index].id),
            targetLanguage: "zh-CN",
          }),
          signal: controller.signal,
        });
        const payload = await readApiPayload(response, "翻译服务暂时不可用，请稍后再试。");
        if (token !== state.loadToken || transcriptId !== state.transcriptId || controller.signal.aborted) return;
        const indexById = new Map(indices.map((index) => [state.transcript[index].id, index]));
        (payload.translations || []).forEach((translation) => {
          const index = indexById.get(translation.segmentId);
          if (index === undefined) return;
          state.translations.set(index, {
            text: String(translation.text || ""),
            note: String(translation.note || ""),
          });
          state.translationErrors.delete(index);
        });
        updateTranslationProgress();
      }
    } catch (error) {
      if (error.name !== "AbortError" && token === state.loadToken && transcriptId === state.transcriptId) {
        indices
          .filter((index) => !state.translations.has(index))
          .forEach((index) => state.translationErrors.set(index, error.message));
        updateTranslationProgress();
      }
    } finally {
      if (controller) state.translationControllers.delete(controller);
      if (token !== state.loadToken || transcriptId !== state.transcriptId || engine !== state.translationEngine) return;
      state.translationActiveBatches = Math.max(0, state.translationActiveBatches - 1);
      indices.forEach((index) => {
        state.translationInFlight.delete(index);
        updateTranslationNodes(index);
      });
      updateTranslationProgress();
      if (state.translationQueue.size && !state.translationTimer) {
        state.translationTimer = window.setTimeout(flushTranslationQueue, 45);
      }
    }
  }

  async function readApiPayload(response, fallback) {
    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {
      // The fallback below is more useful than a JSON parse error.
    }
    if (!response.ok) {
      const message = payload && payload.error && payload.error.message;
      throw new Error(userMessage(message, fallback));
    }
    return payload || {};
  }

  function applyLanguageCapabilities(payload) {
    const language = payload && payload.aiLanguage ? payload.aiLanguage : {};
    state.languageAvailable = Boolean(language.available);
    state.llmConfig = language.config || null;
    updateTranslationToggle();
    if (state.transcript.length) renderTranscript(elements.transcriptSearch.value);
  }

  function fontFamilyForSelect(select, value) {
    return select === elements.subtitleOriginalFont ? ORIGINAL_FONTS[value] : TRANSLATION_FONTS[value];
  }

  function closeFontSelects(except) {
    document.querySelectorAll("[data-font-select]").forEach((wrapper) => {
      if (wrapper === except) return;
      wrapper.querySelector(".font-select-trigger").setAttribute("aria-expanded", "false");
      wrapper.querySelector(".font-select-popover").classList.add("is-hidden");
    });
  }

  function syncFontSelectControl(select) {
    const wrapper = select.closest("[data-font-select]");
    if (!wrapper) return;
    const option = select.selectedOptions[0];
    const trigger = wrapper.querySelector(".font-select-trigger");
    trigger.querySelector("[data-font-current]").textContent = option.textContent;
    trigger.querySelector("[data-font-description]").textContent = option.dataset.description || "";
    trigger.style.setProperty("--font-preview", fontFamilyForSelect(select, select.value));
    wrapper.querySelectorAll(".font-select-option").forEach((button) => {
      const active = button.dataset.value === select.value;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function initializeFontSelects() {
    document.querySelectorAll("[data-font-select]").forEach((wrapper) => {
      const select = wrapper.querySelector("select");
      const trigger = wrapper.querySelector(".font-select-trigger");
      const popover = wrapper.querySelector(".font-select-popover");
      Array.from(select.children).forEach((group) => {
        const label = document.createElement("div");
        label.className = "font-select-group-label";
        label.textContent = group.label;
        popover.appendChild(label);
        Array.from(group.children).forEach((option) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "font-select-option";
          button.dataset.value = option.value;
          button.setAttribute("role", "option");
          button.style.setProperty("--font-preview", fontFamilyForSelect(select, option.value));
          const copy = document.createElement("span");
          const name = document.createElement("b");
          const description = document.createElement("small");
          name.textContent = option.textContent;
          description.textContent = option.dataset.description || "";
          copy.append(name, description);
          button.appendChild(copy);
          popover.appendChild(button);
        });
      });
      trigger.addEventListener("click", () => {
        const opening = popover.classList.contains("is-hidden");
        closeFontSelects(opening ? wrapper : null);
        closeColorPicker();
        popover.classList.toggle("is-hidden", !opening);
        trigger.setAttribute("aria-expanded", String(opening));
      });
      popover.addEventListener("click", (event) => {
        const optionButton = event.target.closest(".font-select-option");
        if (!optionButton) return;
        select.value = optionButton.dataset.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        closeFontSelects();
        trigger.focus();
      });
      syncFontSelectControl(select);
    });
  }

  function hexToHsv(hex) {
    const value = parseInt(hex.slice(1), 16);
    const r = ((value >> 16) & 255) / 255;
    const g = ((value >> 8) & 255) / 255;
    const b = (value & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    if (delta) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * ((b - r) / delta + 2);
      else h = 60 * ((r - g) / delta + 4);
    }
    return { h: (h + 360) % 360, s: max ? delta / max : 0, v: max };
  }

  function hsvToHex({ h, s, v }) {
    const chroma = v * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const offset = v - chroma;
    const channels = h < 60 ? [chroma, x, 0]
      : h < 120 ? [x, chroma, 0]
        : h < 180 ? [0, chroma, x]
          : h < 240 ? [0, x, chroma]
            : h < 300 ? [x, 0, chroma]
              : [chroma, 0, x];
    return `#${channels.map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("")}`;
  }

  function syncColorPickerFromHex(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    colorPickerHsv = hexToHsv(hex);
    elements.colorHue.value = String(Math.round(colorPickerHsv.h));
    elements.colorHue.style.setProperty("--picker-hue", colorPickerHsv.h.toFixed(1));
    elements.colorSaturation.style.setProperty("--picker-hue", colorPickerHsv.h.toFixed(1));
    elements.colorSaturation.style.setProperty("--picker-saturation", `${(colorPickerHsv.s * 100).toFixed(1)}%`);
    elements.colorSaturation.style.setProperty("--picker-value", `${((1 - colorPickerHsv.v) * 100).toFixed(1)}%`);
    elements.customColorButton.style.setProperty("--custom-color", hex);
    elements.colorPreview.style.setProperty("--custom-color", hex);
  }

  function applyColorPickerHsv() {
    const hex = hsvToHex(colorPickerHsv);
    elements.subtitleTranslationColor.value = hex;
    updateSubtitleStyleFromControls();
  }

  function closeColorPicker() {
    elements.subtitleColorPicker.classList.add("is-hidden");
    elements.customColorButton.setAttribute("aria-expanded", "false");
  }

  function updateColorSaturationFromPointer(event) {
    const bounds = elements.colorSaturation.getBoundingClientRect();
    colorPickerHsv.s = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    colorPickerHsv.v = 1 - Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    applyColorPickerHsv();
  }

  function applySubtitleStyle(style = state.subtitleStyle) {
    const root = document.documentElement;
    const scale = style.scale / 100;
    root.style.setProperty("--caption-original-size", `${(23 * scale).toFixed(1)}px`);
    root.style.setProperty("--caption-original-long-size", `${(20 * scale).toFixed(1)}px`);
    root.style.setProperty("--caption-original-very-long-size", `${(18 * scale).toFixed(1)}px`);
    root.style.setProperty("--caption-translation-size", `${(14 * scale).toFixed(1)}px`);
    root.style.setProperty("--transcript-original-size", `${(14 * scale).toFixed(1)}px`);
    root.style.setProperty("--transcript-active-size", `${(16.5 * scale).toFixed(1)}px`);
    root.style.setProperty("--transcript-translation-size", `${(10.5 * scale).toFixed(1)}px`);
    root.style.setProperty("--transcript-active-translation-size", `${(11.5 * scale).toFixed(1)}px`);
    root.style.setProperty("--subtitle-original-font", ORIGINAL_FONTS[style.originalFont]);
    root.style.setProperty("--subtitle-translation-font", TRANSLATION_FONTS[style.translationFont]);
    root.style.setProperty("--subtitle-translation-color", style.translationColor);
    root.style.setProperty("--subtitle-translation-opacity", (style.opacity / 100).toFixed(2));
    root.style.setProperty("--subtitle-original-weight", style.bold ? "650" : "500");
    root.style.setProperty("--subtitle-translation-weight", style.bold ? "600" : "400");
  }

  function syncSubtitleStyleControls() {
    const style = state.subtitleStyle;
    elements.subtitleScaleValue.value = `${style.scale}%`;
    elements.subtitleOriginalFont.value = style.originalFont;
    elements.subtitleTranslationFont.value = style.translationFont;
    elements.subtitleTranslationColor.value = style.translationColor;
    elements.subtitleOpacity.value = String(style.opacity);
    elements.subtitleOpacityValue.value = `${style.opacity}%`;
    elements.subtitleBold.checked = style.bold;
    const opacityMin = Number(elements.subtitleOpacity.min);
    const opacityMax = Number(elements.subtitleOpacity.max);
    const opacityFill = ((style.opacity - opacityMin) / (opacityMax - opacityMin)) * 100;
    elements.subtitleOpacity.style.setProperty("--fill", `${opacityFill.toFixed(3)}%`);
    syncFontSelectControl(elements.subtitleOriginalFont);
    syncFontSelectControl(elements.subtitleTranslationFont);
    syncColorPickerFromHex(style.translationColor);
    elements.subtitleColorOptions.querySelectorAll("[data-subtitle-color]").forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.subtitleColor.toLocaleLowerCase() === style.translationColor.toLocaleLowerCase()
      );
    });
    applySubtitleStyle(style);
  }

  function updateSubtitleStyleFromControls() {
    state.subtitleStyle = {
      scale: Number(elements.subtitleScaleValue.value.replace("%", "")) || 100,
      originalFont: elements.subtitleOriginalFont.value,
      translationFont: elements.subtitleTranslationFont.value,
      translationColor: elements.subtitleTranslationColor.value,
      opacity: Number(elements.subtitleOpacity.value),
      bold: elements.subtitleBold.checked,
    };
    syncSubtitleStyleControls();
  }

  function adjustSubtitleScale(delta) {
    const current = Number(elements.subtitleScaleValue.value.replace("%", "")) || 100;
    const next = Math.max(80, Math.min(130, current + delta));
    elements.subtitleScaleValue.value = `${next}%`;
    updateSubtitleStyleFromControls();
  }

  function persistSubtitleStyle() {
    try {
      localStorage.setItem(SUBTITLE_STYLE_KEY, JSON.stringify(state.subtitleStyle));
    } catch (_error) {
      // The style remains active for the current session when storage is unavailable.
    }
  }

  function setSettingsPane(target) {
    const pane = ["appearance", "language", "ai"].includes(target) ? target : "appearance";
    elements.settingsNav.querySelectorAll("[data-settings-target]").forEach((button) => {
      const active = button.dataset.settingsTarget === pane;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    elements.settingsPanes.forEach((section) => {
      section.classList.toggle("is-hidden", section.dataset.settingsPane !== pane);
    });
  }

  function openAiSettings(requestedPane) {
    const pane = typeof requestedPane === "string" ? requestedPane : "appearance";
    const config = state.llmConfig || {};
    elements.aiBaseUrl.value = config.baseUrl || "https://api.deepseek.com";
    elements.aiModel.value = config.model || "deepseek-v4-flash";
    elements.aiApiKey.value = "";
    elements.pronunciationAccentUs.checked = state.pronunciationAccent === "en-US";
    elements.pronunciationAccentUk.checked = state.pronunciationAccent === "en-GB";
    elements.aiSettingsError.textContent = "";
    state.settingsStyleSnapshot = { ...state.subtitleStyle };
    syncSubtitleStyleControls();
    setSettingsPane(pane);
    syncTranslationSettingsForm();
    elements.aiConfigStatus.textContent = state.translationEngine === "chrome"
      ? "已选择 Chrome 本地翻译"
      : state.languageAvailable
        ? `API 已连接 · ${config.model || "模型已配置"}`
        : "API 尚未配置";
    elements.aiKeyHint.textContent = config.hasApiKey
      ? "密钥已配置且不会返回浏览器；粘贴新密钥即可替换。"
      : "密钥只保存在服务进程内存中，服务停止后会自动清除。";
    elements.aiSettingsModal.classList.remove("is-hidden");
    window.requestAnimationFrame(() => {
      elements.settingsNav.querySelector(".is-active")?.focus();
    });
  }

  function closeAiSettings(options) {
    if (state.settingsStyleSnapshot && !(options && options.keepChanges)) {
      state.subtitleStyle = { ...state.settingsStyleSnapshot };
      applySubtitleStyle();
    }
    state.settingsStyleSnapshot = null;
    closeFontSelects();
    closeColorPicker();
    elements.aiSettingsModal.classList.add("is-hidden");
    elements.aiSettingsError.textContent = "";
  }

  async function saveAiSettings(event) {
    event.preventDefault();
    const engine = elements.translationEngineChrome.checked ? "chrome" : "api";
    const pronunciationAccent = elements.pronunciationAccentUk.checked ? "en-GB" : "en-US";
    const config = state.llmConfig || {};
    const apiKey = elements.aiApiKey.value.trim();
    const sameExistingConfig = state.languageAvailable
      && elements.aiBaseUrl.value.trim() === String(config.baseUrl || "")
      && elements.aiModel.value.trim() === String(config.model || "");
    const shouldSaveApi = Boolean(apiKey)
      || (engine === "api" && (state.languageAvailable || state.translationEngine !== engine));
    let apiConfigUpdated = false;
    elements.aiSettingsError.textContent = "";
    elements.aiSettingsSave.disabled = true;
    elements.aiSettingsSave.textContent = "正在保存…";
    try {
      if (shouldSaveApi) {
        if (!elements.aiBaseUrl.value.trim() || !elements.aiModel.value.trim()) {
          throw new Error("请填写 API 地址和模型名称。");
        }
        if (!apiKey && !sameExistingConfig) {
          throw new Error("配置模型 API 时，请填写 API 密钥。");
        }
        if (!sameExistingConfig || apiKey) {
          const response = await fetch("/api/llm-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              baseUrl: elements.aiBaseUrl.value,
              model: elements.aiModel.value,
              apiKey,
            }),
          });
          const payload = await readApiPayload(response, "暂时无法保存模型配置。");
          applyLanguageCapabilities(payload);
          apiConfigUpdated = true;
        }
      }

      if (engine === "chrome") {
        if (state.chromeTranslationAvailability === "unavailable") {
          throw new Error("当前浏览器不支持 Chrome 本地翻译，请改用自定义模型 API。");
        }
        setTranslationEngine("chrome");
      } else {
        setTranslationEngine("api");
      }
      state.pronunciationAccent = pronunciationAccent;
      try {
        localStorage.setItem(PRONUNCIATION_ACCENT_KEY, pronunciationAccent);
      } catch (_error) {
        // The preference still applies for the current session when storage is unavailable.
      }

      if (apiConfigUpdated) {
        if (state.summaryController) state.summaryController.abort();
        state.summaryController = null;
        state.summaryLoading = false;
        state.summaryTranscriptId = null;
        resetSummaryView();
      }
      persistSubtitleStyle();
      state.settingsStyleSnapshot = null;
      closeAiSettings({ keepChanges: true });
      showToast(
        "设置已保存",
        engine === "chrome"
          ? state.languageAvailable
            ? `字幕继续使用 Chrome；内容简介将使用 ${state.llmConfig.model}。`
            : "字幕将在当前设备上完成翻译。"
          : state.languageAvailable
            ? `未完成的字幕将通过 ${state.llmConfig.model} 继续翻译。`
            : `已默认使用${pronunciationAccent === "en-GB" ? "英式" : "美式"}发音；模型 API 尚未配置。`
      );
      if (apiConfigUpdated && state.panelView === "summary") loadAiSummary();
    } catch (error) {
      elements.aiSettingsError.textContent = error.message;
    } finally {
      elements.aiSettingsSave.disabled = false;
      elements.aiSettingsSave.textContent = "保存设置";
    }
  }

  async function loadLanguageCapabilities() {
    try {
      const response = await fetch("/api/capabilities", { headers: { Accept: "application/json" } });
      const payload = await readApiPayload(response, "AI 语言功能暂时不可用。");
      applyLanguageCapabilities(payload);
    } catch (_error) {
      state.languageAvailable = false;
      state.llmConfig = null;
    } finally {
      updateTranslationToggle();
      if (state.transcript.length) renderTranscript(elements.transcriptSearch.value);
    }
  }

  function openDictionary(selection) {
    hideWordPreview();
    if (!elements.analysisCard.classList.contains("is-hidden")) {
      closeSentenceAnalysis({ preserveStudySession: true });
    }
    beginStudyOverlay("dictionary");
    elements.dictionaryCard.classList.remove("is-hidden");
    elements.dictionaryCard.setAttribute("aria-busy", "true");
    elements.dictionaryCard.scrollTop = 0;
    elements.dictionaryTerm.textContent = selection;
    elements.dictionaryMeta.textContent = "";
    elements.dictionaryLoading.classList.remove("is-hidden");
    elements.dictionaryStatus.textContent = "词典释义加载中";
    elements.dictionaryStatus.classList.add("sr-only");
    elements.dictionaryStatus.classList.remove("is-error");
    elements.dictionaryContent.classList.add("is-hidden");
    elements.dictionaryCard.classList.remove("is-enriching");
  }

  function closeDictionary(options) {
    hideWordPreview();
    state.dictionaryRequestId += 1;
    elements.dictionaryCard.classList.add("is-hidden");
    elements.dictionaryCard.removeAttribute("aria-busy");
    if (state.dictionaryController) state.dictionaryController.abort();
    state.dictionaryController = null;
    elements.dictionaryCard.classList.remove("is-enriching");
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) selection.removeAllRanges();
    endStudyOverlay("dictionary", options);
  }

  function showDictionaryError(message) {
    elements.dictionaryCard.setAttribute("aria-busy", "false");
    elements.dictionaryCard.classList.remove("is-enriching");
    elements.dictionaryLoading.classList.add("is-hidden");
    elements.dictionaryStatus.textContent = message;
    elements.dictionaryStatus.classList.remove("sr-only");
    elements.dictionaryStatus.classList.add("is-error");
    elements.dictionaryContent.classList.add("is-hidden");
  }

  function dictionarySenseElement(sense) {
    const section = document.createElement("section");
    section.className = "dictionary-sense";
    const heading = document.createElement("span");
    heading.textContent = sense.partOfSpeech || "常用释义";
    const meaning = document.createElement("p");
    meaning.className = "dictionary-sense-meaning";
    meaning.textContent = sense.meaning || "";
    const english = document.createElement("p");
    english.className = "dictionary-sense-english";
    english.textContent = sense.englishDefinition || "";
    section.append(heading, meaning, english);
    if (sense.example || sense.exampleTranslation) {
      const example = document.createElement("div");
      example.className = "dictionary-sense-example";
      const sentence = document.createElement("p");
      sentence.textContent = sense.example || "";
      const translation = document.createElement("small");
      translation.textContent = sense.exampleTranslation || "";
      example.append(sentence, translation);
      section.appendChild(example);
    }
    return section;
  }

  function renderDictionaryChips(container, values, valueForItem) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    container.replaceChildren(...items.map((item) => {
      const chip = document.createElement("span");
      const value = valueForItem ? valueForItem(item) : String(item);
      chip.textContent = value;
      return chip;
    }));
    return items.length > 0;
  }

  function renderDictionaryDetailList(container, values, titleKey, detailKey) {
    const items = Array.isArray(values) ? values.filter(Boolean) : [];
    container.replaceChildren(...items.map((item) => {
      const row = document.createElement("p");
      const title = document.createElement("b");
      title.textContent = String(item[titleKey] || "");
      const detail = String(item[detailKey] || "");
      row.append(title);
      if (detail) row.append(document.createTextNode(` — ${detail}`));
      return row;
    }));
    return items.length > 0;
  }

  function renderDictionaryEntry(entry, options) {
    const config = options || {};
    elements.dictionaryTerm.textContent = entry.headword || entry.selection;
    const meta = entry.partOfSpeech || "";
    elements.dictionaryMeta.textContent = config.enriching
      ? `${meta}${meta ? " · " : ""}本地释义已就绪，AI 正在补充`
      : meta;
    const fallbackPronunciation = entry.pronunciation || "";
    elements.dictionaryPronunciationUS.textContent = entry.pronunciationUS || fallbackPronunciation;
    elements.dictionaryPronunciationUK.textContent = entry.pronunciationUK || fallbackPronunciation;
    elements.dictionaryContext.textContent = entry.source === "local" ? "" : entry.contextMeaning;
    const senses = Array.isArray(entry.senses) && entry.senses.length
      ? entry.senses
      : [{
          partOfSpeech: entry.partOfSpeech,
          meaning: entry.meaning,
          englishDefinition: entry.englishMeaning,
          example: entry.example,
          exampleTranslation: entry.exampleTranslation,
        }];
    elements.dictionarySenses.replaceChildren(...senses.map(dictionarySenseElement));

    const hasForms = renderDictionaryChips(elements.dictionaryWordForms, entry.wordForms, (item) => (
      `${item.label || "词形"} · ${item.word || ""}`
    ));
    elements.dictionaryWordFormsBlock.classList.toggle("is-hidden", !hasForms);
    elements.dictionaryEtymology.textContent = entry.etymology || "";
    elements.dictionaryEtymologyBlock.classList.toggle("is-hidden", !String(entry.etymology || "").trim());
    elements.dictionaryPhrasesBlock.classList.toggle(
      "is-hidden",
      !renderDictionaryDetailList(elements.dictionaryPhrases, entry.phrases, "phrase", "meaning")
    );
    elements.dictionarySynonymsBlock.classList.toggle(
      "is-hidden",
      !renderDictionaryChips(elements.dictionarySynonyms, entry.synonyms)
    );
    elements.dictionaryWordFamilyBlock.classList.toggle(
      "is-hidden",
      !renderDictionaryDetailList(elements.dictionaryWordFamily, entry.wordFamily, "word", "meaning")
    );
    elements.dictionaryStatus.textContent = "";
    elements.dictionaryStatus.classList.add("sr-only");
    elements.dictionaryStatus.classList.remove("is-error");
    elements.dictionaryLoading.classList.add("is-hidden");
    elements.dictionaryContent.classList.remove("is-hidden");
    elements.dictionaryCard.classList.toggle("is-enriching", Boolean(config.enriching));
    elements.dictionaryCard.setAttribute("aria-busy", config.enriching ? "true" : "false");
  }

  async function fetchLocalDefinition(selection, index, signal) {
    const cacheKey = selection.toLocaleLowerCase();
    const cached = state.localDictionaryCache.get(cacheKey);
    if (cached) return cached;

    const phraseDefinition = COMMON_PHRASES.get(cacheKey);
    if (phraseDefinition) {
      const entry = {
        source: "local",
        selection,
        headword: selection,
        partOfSpeech: "常用短语",
        meaning: phraseDefinition[0],
        englishMeaning: phraseDefinition[1],
        senses: [{
          partOfSpeech: "常用短语",
          meaning: phraseDefinition[0],
          englishDefinition: phraseDefinition[1],
        }],
      };
      state.localDictionaryCache.set(cacheKey, entry);
      return entry;
    }

    const response = await fetch("/api/dictionary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcriptId: state.transcriptId,
        segmentId: state.transcript[index].id,
        selection,
        targetLanguage: "zh-CN",
        localOnly: true,
      }),
      signal,
    });
    const payload = await readApiPayload(response, "本地词典暂时不可用。");
    const entry = payload.entry || {};
    state.localDictionaryCache.set(cacheKey, entry);
    return entry;
  }

  function hideWordPreview() {
    if (state.wordPreviewTimer) window.clearTimeout(state.wordPreviewTimer);
    state.wordPreviewTimer = null;
    if (state.wordPreviewController) state.wordPreviewController.abort();
    state.wordPreviewController = null;
    if (state.wordPreviewTarget) state.wordPreviewTarget.removeAttribute("aria-describedby");
    state.wordPreviewTarget = null;
    elements.wordPreview.classList.add("is-hidden");
  }

  function positionWordPreview(target) {
    const targetRect = target.getBoundingClientRect();
    const previewRect = elements.wordPreview.getBoundingClientRect();
    const margin = 12;
    const gap = 12;
    if (target.classList.contains("caption-word") || target.classList.contains("caption-phrase")) {
      let left = Math.max(margin, Math.min(targetRect.left, window.innerWidth - previewRect.width - margin));
      let top = targetRect.top - previewRect.height - gap;
      if (top < margin) top = targetRect.bottom + gap;
      top = Math.max(margin, Math.min(top, window.innerHeight - previewRect.height - margin));
      elements.wordPreview.style.left = `${left}px`;
      elements.wordPreview.style.top = `${top}px`;
      return;
    }

    let left = targetRect.right + gap;
    if (left + previewRect.width > window.innerWidth - margin) left = targetRect.left - previewRect.width - gap;
    left = Math.max(margin, Math.min(left, window.innerWidth - previewRect.width - margin));

    let top = targetRect.top + targetRect.height / 2 - previewRect.height / 2;
    top = Math.max(margin, Math.min(top, window.innerHeight - previewRect.height - margin));
    elements.wordPreview.style.left = `${left}px`;
    elements.wordPreview.style.top = `${top}px`;
  }

  function renderWordPreview(entry, target) {
    if (target !== state.wordPreviewTarget || !target.isConnected) return;
    elements.wordPreviewTerm.textContent = entry.headword || entry.selection;
    elements.wordPreviewMeta.textContent = entry.partOfSpeech || "";
    const pronunciation = entry.pronunciation || "";
    elements.wordPreviewPronunciationUS.textContent = entry.pronunciationUS || pronunciation || "—";
    elements.wordPreviewPronunciationUK.textContent = entry.pronunciationUK || pronunciation || "—";

    const senses = Array.isArray(entry.senses) && entry.senses.length
      ? entry.senses
      : [{
          partOfSpeech: entry.partOfSpeech,
          meaning: entry.meaning,
          englishDefinition: entry.englishMeaning,
        }];
    elements.wordPreviewSenses.replaceChildren(...senses.slice(0, 6).map((sense) => {
      const row = document.createElement("section");
      const heading = document.createElement("span");
      heading.textContent = sense.partOfSpeech || "常用释义";
      const meaning = document.createElement("p");
      meaning.textContent = sense.meaning || "";
      const definition = document.createElement("small");
      definition.textContent = sense.englishDefinition || "";
      row.append(heading, meaning, definition);
      return row;
    }));

    const forms = Array.isArray(entry.wordForms) ? entry.wordForms.filter((item) => item && item.word) : [];
    elements.wordPreviewForms.textContent = forms
      .slice(0, 6)
      .map((item) => `${item.label || "词形"} ${item.word}`)
      .join(" · ");
    elements.wordPreviewForms.classList.toggle("is-hidden", !forms.length);
    elements.wordPreview.classList.remove("is-hidden");
    target.setAttribute("aria-describedby", "wordPreview");
    requestAnimationFrame(() => positionWordPreview(target));
  }

  function scheduleWordPreview(target, delay = 480) {
    if (!target || target === state.wordPreviewTarget || !state.transcriptId) return;
    hideWordPreview();
    state.wordPreviewTarget = target;
    state.wordPreviewTimer = window.setTimeout(async () => {
      const selection = String(target.dataset.selection || "").trim();
      const index = Number(target.dataset.index);
      if (!selection || !state.transcript[index] || target !== state.wordPreviewTarget) return;
      const controller = new AbortController();
      state.wordPreviewController = controller;
      try {
        const entry = await fetchLocalDefinition(selection, index, controller.signal);
        if (!controller.signal.aborted) renderWordPreview(entry, target);
      } catch (error) {
        if (error.name !== "AbortError" && target === state.wordPreviewTarget) hideWordPreview();
      } finally {
        if (state.wordPreviewController === controller) state.wordPreviewController = null;
      }
    }, delay);
  }

  async function lookupDefinition(selectionValue, index) {
    const selection = String(selectionValue || "").replace(/\s+/g, " ").trim();
    if (!selection || !state.transcript[index] || selection.length > 120) return;
    const requestId = ++state.dictionaryRequestId;
    if (state.dictionaryController) state.dictionaryController.abort();
    state.dictionaryController = null;
    openDictionary(selection);
    speakDictionaryTerm(state.pronunciationAccent, selection);
    if (!state.transcriptId) {
      showDictionaryError("当前字幕已失效，请重新导入视频。");
      return;
    }

    const cacheKey = `${state.transcriptId}:${state.transcript[index].id}:${selection.toLocaleLowerCase()}`;
    const cached = state.dictionaryCache.get(cacheKey);
    if (cached) {
      if (requestId === state.dictionaryRequestId) renderDictionaryEntry(cached);
      return;
    }

    const controller = new AbortController();
    state.dictionaryController = controller;
    const token = state.loadToken;
    let localEntry = null;
    let enrichmentFinished = false;
    const localPromise = fetchLocalDefinition(selection, index, controller.signal)
      .then((entry) => {
        localEntry = entry;
        if (
          token === state.loadToken
          && requestId === state.dictionaryRequestId
          && !controller.signal.aborted
          && !enrichmentFinished
        ) renderDictionaryEntry(entry, { enriching: state.languageAvailable });
        return entry;
      })
      .catch(() => null);

    try {
      if (!state.languageAvailable) {
        const entry = await localPromise;
        if (!entry) throw new Error("本地词典暂未收录该词或短语。配置模型 API 后可使用 AI 语境解释。");
        state.dictionaryCache.set(cacheKey, entry);
        if (requestId === state.dictionaryRequestId) renderDictionaryEntry(entry);
        return;
      }

      const response = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcriptId: state.transcriptId,
          segmentId: state.transcript[index].id,
          selection,
          targetLanguage: "zh-CN",
        }),
        signal: controller.signal,
      });
      const payload = await readApiPayload(response, "词典查询暂时不可用，请稍后再试。");
      if (token !== state.loadToken || requestId !== state.dictionaryRequestId || controller.signal.aborted) return;
      const entry = payload.entry || {};
      enrichmentFinished = true;
      state.dictionaryCache.set(cacheKey, entry);
      renderDictionaryEntry(entry);
    } catch (error) {
      if (error.name !== "AbortError") await localPromise;
      if (
        error.name !== "AbortError"
        && token === state.loadToken
        && requestId === state.dictionaryRequestId
      ) {
        if (localEntry) {
          elements.dictionaryCard.classList.remove("is-enriching");
          elements.dictionaryCard.setAttribute("aria-busy", "false");
          const meta = localEntry.partOfSpeech || "";
          elements.dictionaryMeta.textContent = `${meta}${meta ? " · " : ""}AI 补充暂不可用`;
        } else {
          showDictionaryError(error.message);
        }
      }
    } finally {
      if (state.dictionaryController === controller) state.dictionaryController = null;
    }
  }

  function lookupSelectedPhrase() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().replace(/\s+/g, " ").trim();
    if (!text || text.length > 120) return;
    const anchorElement = selection.anchorNode && (
      selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode
        : selection.anchorNode.parentElement
    );
    const focusElement = selection.focusNode && (
      selection.focusNode.nodeType === Node.ELEMENT_NODE
        ? selection.focusNode
        : selection.focusNode.parentElement
    );
    const anchorCopy = anchorElement && anchorElement.closest(".line-copy");
    const focusCopy = focusElement && focusElement.closest(".line-copy");
    if (!anchorCopy || anchorCopy !== focusCopy) return;
    const item = anchorCopy.closest(".transcript-item");
    if (!item) return;
    const index = Number(item.dataset.index);
    lookupDefinition(text, index);
  }

  function clearPhraseRange() {
    elements.transcriptList
      .querySelectorAll(".line-word.is-range-selected")
      .forEach((word) => word.classList.remove("is-range-selected"));
  }

  function updatePhraseRange(startWord, endWord) {
    clearPhraseRange();
    const line = startWord.closest(".line-copy");
    if (!line || endWord.closest(".line-copy") !== line) return;
    const words = Array.from(line.querySelectorAll(".line-word"));
    const start = words.indexOf(startWord);
    const end = words.indexOf(endWord);
    if (start < 0 || end < 0 || start === end) return;
    const lower = Math.min(start, end);
    const upper = Math.max(start, end);
    words.slice(lower, upper + 1).forEach((word) => word.classList.add("is-range-selected"));
  }

  function phraseFromWords(startWord, endWord) {
    const line = startWord.closest(".line-copy");
    if (!line || endWord.closest(".line-copy") !== line) return "";
    const words = Array.from(line.querySelectorAll(".line-word"));
    const start = words.indexOf(startWord);
    const end = words.indexOf(endWord);
    if (start < 0 || end < 0 || start === end) return "";
    const lower = Math.min(start, end);
    const upper = Math.max(start, end);
    const range = document.createRange();
    range.setStartBefore(words[lower]);
    range.setEndAfter(words[upper]);
    return range.toString().replace(/\s+/g, " ").trim();
  }

  function toggleSearch() {
    const opening = elements.searchRow.classList.contains("is-hidden");
    elements.searchRow.classList.toggle("is-hidden", !opening);
    if (opening) {
      requestAnimationFrame(() => elements.transcriptSearch.focus());
    } else {
      elements.transcriptSearch.value = "";
      renderTranscript("");
    }
  }

  function setPlaybackSpeed(index) {
    const speedIndex = Math.max(0, Math.min(SPEEDS.length - 1, Number(index) || 0));
    state.speed = SPEEDS[speedIndex];
    const label = `${state.speed}${state.speed === 2 || state.speed === 3 ? ".0" : ""}×`;
    elements.speedValue.value = label;
    elements.speedButtonValue.textContent = label;
    elements.speedRange.setAttribute("aria-valuetext", label);
    elements.speedRange.style.setProperty("--fill", `${(speedIndex / (SPEEDS.length - 1)) * 100}%`);

    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      state.ytPlayer.setPlaybackRate(state.speed);
    }
    if (state.playerKind === "direct" && state.directPlayer) {
      state.directPlayer.playbackRate = state.speed;
    }
  }

  function setVolume(value) {
    state.volume = Math.max(0, Math.min(100, Number(value) || 0));
    elements.volumeValue.value = `${state.volume}%`;
    elements.volumeRange.style.setProperty("--fill", `${state.volume}%`);
    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      state.ytPlayer.setVolume(state.volume);
    }
    if (state.playerKind === "direct" && state.directPlayer) {
      state.directPlayer.volume = state.volume / 100;
    }
  }

  function speakDictionaryTerm(accent, term) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      showToast("当前浏览器无法播放发音", "你仍可参考卡片中的音标。");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(term || elements.dictionaryTerm.textContent).trim());
    utterance.lang = accent;
    utterance.rate = 0.86;
    const voice = window.speechSynthesis.getVoices().find((candidate) => candidate.lang === accent);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function closeSentenceAnalysis(options) {
    state.analysisRequestId += 1;
    elements.analysisCard.classList.add("is-hidden");
    elements.analysisButton.setAttribute("aria-expanded", "false");
    if (state.analysisController) state.analysisController.abort();
    state.analysisController = null;
    endStudyOverlay("analysis", options);
  }

  function analysisParagraph(label, text) {
    const paragraph = document.createElement("p");
    if (label) {
      const strong = document.createElement("b");
      strong.textContent = label;
      paragraph.append(strong, document.createTextNode(` — ${text}`));
    } else {
      paragraph.textContent = text;
    }
    return paragraph;
  }

  function renderSentenceAnalysis(analysis) {
    elements.analysisGrammar.replaceChildren(...(analysis.grammar || []).map((item) => (
      analysisParagraph(item.point, item.explanation)
    )));
    elements.analysisPattern.replaceChildren(analysisParagraph(
      analysis.sentencePattern && analysis.sentencePattern.name,
      analysis.sentencePattern && analysis.sentencePattern.explanation
    ));
    elements.analysisPhrases.replaceChildren(...(analysis.phrases || []).map((item) => (
      analysisParagraph(item.phrase, item.meaning)
    )));
    elements.analysisReading.replaceChildren(...(analysis.readingTips || []).map((item) => (
      analysisParagraph(item.focus, item.tip)
    )));
    elements.analysisStatus.textContent = "";
    elements.analysisStatus.classList.remove("is-error");
    elements.analysisContent.classList.remove("is-hidden");
    elements.analysisCard.setAttribute("aria-busy", "false");
  }

  async function analyzeCurrentSentence() {
    const index = state.activeIndex >= 0 ? state.activeIndex : 0;
    const segment = state.transcript[index];
    if (!segment || !state.transcriptId) return;
    if (!state.languageAvailable) {
      showToast("需要配置模型 API", "请先在设置中连接用于句子分析的模型。");
      openAiSettings("ai");
      return;
    }

    if (!elements.analysisCard.classList.contains("is-hidden")) {
      closeSentenceAnalysis();
      return;
    }

    if (!elements.dictionaryCard.classList.contains("is-hidden")) {
      closeDictionary({ preserveStudySession: true });
    }
    beginStudyOverlay("analysis");
    const requestId = ++state.analysisRequestId;
    elements.analysisSentence.textContent = segment.text;
    elements.analysisStatus.textContent = "正在拆解语法、句式与朗读节奏…";
    elements.analysisStatus.classList.remove("is-error");
    elements.analysisContent.classList.add("is-hidden");
    elements.analysisCard.classList.remove("is-hidden");
    elements.analysisCard.setAttribute("aria-busy", "true");
    elements.analysisButton.setAttribute("aria-expanded", "true");

    const cacheKey = `${state.transcriptId}:${segment.id}`;
    const cached = state.analysisCache.get(cacheKey);
    if (cached) {
      renderSentenceAnalysis(cached);
      return;
    }

    const controller = new AbortController();
    state.analysisController = controller;
    const token = state.loadToken;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcriptId: state.transcriptId, segmentId: segment.id, targetLanguage: "zh-CN" }),
        signal: controller.signal,
      });
      const payload = await readApiPayload(response, "句子分析暂时不可用，请稍后再试。");
      if (token !== state.loadToken || requestId !== state.analysisRequestId || controller.signal.aborted) return;
      const analysis = payload.analysis || {};
      state.analysisCache.set(cacheKey, analysis);
      renderSentenceAnalysis(analysis);
    } catch (error) {
      if (error.name !== "AbortError" && token === state.loadToken && requestId === state.analysisRequestId) {
        elements.analysisStatus.textContent = error.message;
        elements.analysisStatus.classList.add("is-error");
        elements.analysisCard.setAttribute("aria-busy", "false");
      }
    } finally {
      if (state.analysisController === controller) state.analysisController = null;
    }
  }

  function closeTuningPopovers(except) {
    [
      [elements.speedButton, elements.speedPopover],
      [elements.volumeButton, elements.volumePopover],
    ].forEach(([button, popover]) => {
      if (popover === except) return;
      popover.classList.add("is-hidden");
      button.setAttribute("aria-expanded", "false");
    });
  }

  function toggleTuningPopover(button, popover) {
    const opening = popover.classList.contains("is-hidden");
    closeTuningPopovers(opening ? popover : null);
    popover.classList.toggle("is-hidden", !opening);
    button.setAttribute("aria-expanded", String(opening));
    if (opening) window.requestAnimationFrame(() => popover.querySelector('input[type="range"]').focus());
  }

  function toggleLoop() {
    state.loopLine = !state.loopLine;
    elements.loopButton.classList.toggle("is-active", state.loopLine);
    elements.loopButton.setAttribute("aria-pressed", String(state.loopLine));
    elements.loopButton.setAttribute("aria-label", state.loopLine ? "关闭单句循环" : "循环当前句");
    elements.loopButton.dataset.controlTooltip = state.loopLine ? "关闭单句循环" : "循环当前句";
    showToast(
      state.loopLine ? "已开启单句循环" : "已关闭单句循环",
      state.loopLine ? "当前句子会自动重复播放。" : "视频将按正常顺序继续播放。"
    );
  }

  function toggleAutoFollow() {
    state.autoFollow = !state.autoFollow;
    elements.followToggle.classList.toggle("is-active", state.autoFollow);
    elements.followToggle.setAttribute("aria-pressed", String(state.autoFollow));
    if (state.autoFollow) setActiveSegment(state.activeIndex < 0 ? 0 : state.activeIndex);
  }

  function downloadTranscript() {
    if (!state.transcript.length) return;
    const content = state.transcript
      .map((segment, index) => `${String(index + 1).padStart(2, "0")}  ${formatTime(segment.start)}\n${segment.text}`)
      .join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vreply-transcript.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("字幕已下载", "带时间信息的练习字幕已保存。");
  }

  function returnHome() {
    ++state.loadToken;
    setPlaying(false);
    cleanupPlayer();
    closeTuningPopovers();
    document.body.classList.remove("workspace-active", "workspace-entering", "import-committing", "door-opening");
    document.documentElement.classList.remove("workspace-view-transition");
    setImportBusy(false);
    state.source = null;
    state.transcript = [];
    state.transcriptId = null;
    state.activeIndex = -1;
    state.showTranslations = false;
    state.revealedTranslations.clear();
    state.translations.clear();
    state.translationErrors.clear();
    state.translationQueue.clear();
    state.translationInFlight.clear();
    state.phrasePointer = null;
    state.suppressWordClick = false;
    if (state.hoverLookupTimer) window.clearTimeout(state.hoverLookupTimer);
    state.hoverLookupTimer = null;
    state.hoverLookupCandidate = null;
    state.hoverLookupPoint = null;
    state.hoverLookupTarget = null;
    state.studyOverlay = null;
    state.resumeAfterStudy = false;
    state.translationControllers.forEach((controller) => controller.abort());
    state.translationControllers.clear();
    state.translationActiveBatches = 0;
    if (state.summaryController) state.summaryController.abort();
    state.summaryController = null;
    state.summaryLoading = false;
    state.summaryTranscriptId = null;
    if (state.translationTimer) window.clearTimeout(state.translationTimer);
    state.translationTimer = null;
    if (state.translationObserver) state.translationObserver.disconnect();
    closeDictionary({ resume: false });
    closeSentenceAnalysis({ resume: false });
    setPanelView("transcript");
    resetSummaryView();
    updateTranslationToggle();
    elements.videoMount.replaceChildren();
    elements.videoAmbient.style.backgroundImage = "";
    elements.workspaceView.classList.add("is-hidden");
    elements.landingView.classList.remove("is-hidden");
    elements.newVideoButton.classList.add("is-hidden");
    elements.videoUrl.value = "";
    elements.transcriptSearch.value = "";
    elements.searchRow.classList.add("is-hidden");
    elements.searchResultCount.textContent = "0";
    elements.captionOverlay.classList.remove("is-visible");
    elements.captionOverlay.classList.remove("has-translation");
    elements.captionText.textContent = "当前句子会显示在这里。";
    elements.captionText.classList.remove("is-long", "is-very-long");
    elements.captionTranslation.textContent = "译文将在开启翻译后显示";
    elements.captionTranslation.classList.remove("is-loading", "has-error");
    clearFieldError();
    requestAnimationFrame(() => elements.videoUrl.focus());
  }

  function showFieldError(message) {
    elements.urlError.textContent = message;
    elements.urlField.classList.remove("has-error");
    void elements.urlField.offsetWidth;
    elements.urlField.classList.add("has-error");
    elements.videoUrl.setAttribute("aria-invalid", "true");
  }

  function clearFieldError() {
    elements.urlError.textContent = "";
    elements.urlField.classList.remove("has-error");
    elements.videoUrl.removeAttribute("aria-invalid");
  }

  function showToast(title, message) {
    clearTimeout(state.toastTimer);
    elements.toastTitle.textContent = title;
    elements.toastText.textContent = message;
    elements.toast.classList.add("is-visible");
    state.toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 3200);
  }

  function saveSession() {
    try {
      localStorage.setItem(
        "vreply:last-session",
        JSON.stringify({
          url: state.source.url,
          title: elements.projectTitle.textContent,
          savedAt: Date.now(),
        })
      );
    } catch (_error) {
      // Local storage can be unavailable in privacy-focused browsing modes.
    }
  }

  function formatTime(value) {
    const total = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function shortTime(value) {
    const total = Math.max(0, Math.floor(Number(value) || 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  function delay(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function subtitleLookupTarget(node) {
    if (!(node instanceof Element)) return null;
    return node.closest(".line-phrase[data-selection], .caption-phrase[data-selection]")
      || node.closest(".line-word[data-selection], .caption-word[data-selection]");
  }

  function clearHoverLookupTimer() {
    if (state.hoverLookupTimer) window.clearTimeout(state.hoverLookupTimer);
    state.hoverLookupTimer = null;
  }

  function clearHoverLookup(options) {
    clearHoverLookupTimer();
    state.hoverLookupCandidate = null;
    state.hoverLookupPoint = null;
    if (!state.hoverLookupTarget) return;
    state.hoverLookupTarget = null;
    hideWordPreview();
    if (state.studyOverlay === "lookup-hover") endStudyOverlay("lookup-hover", options);
  }

  function activateHoverLookup(target) {
    if (target !== state.hoverLookupCandidate || !target.isConnected) return;
    const point = state.hoverLookupPoint;
    const current = point
      ? subtitleLookupTarget(document.elementFromPoint(point.x, point.y))
      : null;
    if (current !== target) return;
    state.hoverLookupTimer = null;
    state.hoverLookupCandidate = null;
    state.hoverLookupPoint = null;
    state.hoverLookupTarget = target;
    if (!state.studyOverlay) beginStudyOverlay("lookup-hover");
    scheduleWordPreview(target, 0);
  }

  function scheduleHoverLookup(target, event) {
    if (!target || target === state.hoverLookupTarget) return;
    if (state.hoverLookupTarget) clearHoverLookup();
    clearHoverLookupTimer();
    state.hoverLookupCandidate = target;
    state.hoverLookupPoint = { x: event.clientX, y: event.clientY };
    state.hoverLookupTimer = window.setTimeout(
      () => activateHoverLookup(target),
      HOVER_LOOKUP_DELAY_MS
    );
  }

  elements.urlForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startImport(elements.videoUrl.value);
  });

  elements.videoUrl.addEventListener("input", clearFieldError);
  elements.aiSettingsButton.addEventListener("click", () => openAiSettings());
  elements.aiSettingsClose.addEventListener("click", () => closeAiSettings());
  elements.aiSettingsForm.addEventListener("submit", saveAiSettings);
  elements.settingsNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-settings-target]");
    if (button) setSettingsPane(button.dataset.settingsTarget);
  });
  elements.subtitleScaleDown.addEventListener("click", () => adjustSubtitleScale(-10));
  elements.subtitleScaleUp.addEventListener("click", () => adjustSubtitleScale(10));
  [
    elements.subtitleOriginalFont,
    elements.subtitleTranslationFont,
    elements.subtitleOpacity,
    elements.subtitleBold,
  ].forEach((input) => input.addEventListener("input", updateSubtitleStyleFromControls));
  elements.customColorButton.addEventListener("click", () => {
    const opening = elements.subtitleColorPicker.classList.contains("is-hidden");
    closeFontSelects();
    elements.subtitleColorPicker.classList.toggle("is-hidden", !opening);
    elements.customColorButton.setAttribute("aria-expanded", String(opening));
  });
  elements.colorPickerClose.addEventListener("click", () => {
    closeColorPicker();
    elements.customColorButton.focus();
  });
  elements.colorHue.addEventListener("input", (event) => {
    colorPickerHsv.h = Number(event.target.value);
    applyColorPickerHsv();
  });
  elements.colorSaturation.addEventListener("pointerdown", (event) => {
    colorPickerDragging = true;
    elements.colorSaturation.setPointerCapture(event.pointerId);
    updateColorSaturationFromPointer(event);
  });
  elements.colorSaturation.addEventListener("pointermove", (event) => {
    if (colorPickerDragging) updateColorSaturationFromPointer(event);
  });
  elements.colorSaturation.addEventListener("pointerup", (event) => {
    colorPickerDragging = false;
    if (elements.colorSaturation.hasPointerCapture(event.pointerId)) {
      elements.colorSaturation.releasePointerCapture(event.pointerId);
    }
  });
  elements.colorSaturation.addEventListener("pointercancel", () => {
    colorPickerDragging = false;
  });
  elements.colorSaturation.addEventListener("keydown", (event) => {
    const step = event.shiftKey ? 0.1 : 0.02;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "ArrowLeft") colorPickerHsv.s = Math.max(0, colorPickerHsv.s - step);
    if (event.key === "ArrowRight") colorPickerHsv.s = Math.min(1, colorPickerHsv.s + step);
    if (event.key === "ArrowUp") colorPickerHsv.v = Math.min(1, colorPickerHsv.v + step);
    if (event.key === "ArrowDown") colorPickerHsv.v = Math.max(0, colorPickerHsv.v - step);
    applyColorPickerHsv();
  });
  elements.subtitleTranslationColor.addEventListener("input", (event) => {
    if (/^#[0-9a-f]{6}$/i.test(event.target.value)) updateSubtitleStyleFromControls();
  });
  elements.subtitleTranslationColor.addEventListener("change", (event) => {
    if (!/^#[0-9a-f]{6}$/i.test(event.target.value)) {
      event.target.value = state.subtitleStyle.translationColor;
      syncColorPickerFromHex(state.subtitleStyle.translationColor);
    }
  });
  elements.subtitleColorOptions.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-subtitle-color]");
    if (!swatch) return;
    elements.subtitleTranslationColor.value = swatch.dataset.subtitleColor;
    updateSubtitleStyleFromControls();
  });
  [elements.translationEngineChrome, elements.translationEngineApi].forEach((input) => {
    input.addEventListener("change", () => {
      syncTranslationSettingsForm(input.value);
      elements.aiConfigStatus.textContent = input.value === "chrome"
        ? chromeAvailabilityText()
        : state.languageAvailable ? "API 已连接" : "需要配置 API";
      elements.aiSettingsError.textContent = "";
    });
  });
  elements.aiSettingsModal.addEventListener("click", (event) => {
    if (event.target === elements.aiSettingsModal) closeAiSettings();
  });
  elements.brandButton.addEventListener("click", () => {
    if (!elements.workspaceView.classList.contains("is-hidden")) returnHome();
  });
  elements.newVideoButton.addEventListener("click", returnHome);
  elements.playButton.addEventListener("click", () => {
    closeStudyOverlayForPlayback();
    togglePlay();
  });
  elements.videoStage.addEventListener("click", (event) => {
    if (event.target.closest(".extract-overlay, .caption-word, .caption-phrase") || !state.interactiveReady) return;
    closeStudyOverlayForPlayback();
    togglePlay();
  });
  elements.captionText.addEventListener("click", (event) => {
    const word = subtitleLookupTarget(event.target);
    if (!word || !word.closest("#captionText")) return;
    event.stopPropagation();
    lookupDefinition(word.dataset.selection, Number(word.dataset.index));
  });
  elements.captionText.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const word = subtitleLookupTarget(event.target);
    if (!word || !word.closest("#captionText")) return;
    event.preventDefault();
    lookupDefinition(word.dataset.selection, Number(word.dataset.index));
  });
  elements.rewindButton.addEventListener("click", () => jumpSentence(-1));
  elements.forwardButton.addEventListener("click", () => jumpSentence(1));
  elements.progressRange.addEventListener("input", (event) => {
    seekTo(event.target.value);
    updateProgressTooltip(Number(event.target.value));
  });
  elements.progressRange.addEventListener("pointerenter", (event) => {
    state.timelineHovering = true;
    previewTimelineAt(event.clientX);
  });
  elements.progressRange.addEventListener("pointermove", (event) => previewTimelineAt(event.clientX));
  elements.progressRange.addEventListener("pointerleave", () => {
    state.timelineHovering = false;
    updateProgressTooltip(state.currentTime);
  });
  elements.speedButton.addEventListener("click", () => toggleTuningPopover(elements.speedButton, elements.speedPopover));
  elements.speedRange.addEventListener("input", (event) => setPlaybackSpeed(event.target.value));
  elements.volumeButton.addEventListener("click", () => toggleTuningPopover(elements.volumeButton, elements.volumePopover));
  elements.volumeRange.addEventListener("input", (event) => setVolume(event.target.value));
  elements.analysisButton.addEventListener("click", analyzeCurrentSentence);
  elements.analysisClose.addEventListener("click", closeSentenceAnalysis);
  elements.loopButton.addEventListener("click", toggleLoop);
  elements.followToggle.addEventListener("click", toggleAutoFollow);
  elements.translationToggle.addEventListener("click", toggleTranslations);
  elements.transcriptTab.addEventListener("click", () => setPanelView("transcript"));
  elements.summaryTab.addEventListener("click", () => setPanelView("summary"));
  elements.summaryRetryButton.addEventListener("click", () => {
    state.summaryTranscriptId = null;
    if (state.languageAvailable) loadAiSummary();
    else openAiSettings("ai");
  });
  elements.dictionaryClose.addEventListener("click", closeDictionary);
  elements.dictionaryPronunciations.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-accent]");
    if (button) speakDictionaryTerm(button.dataset.accent);
  });
  elements.searchButton.addEventListener("click", toggleSearch);
  elements.transcriptSearch.addEventListener("input", (event) => renderTranscript(event.target.value));
  elements.downloadButton.addEventListener("click", downloadTranscript);
  elements.summaryPoints.addEventListener("click", (event) => {
    const point = event.target.closest(".summary-point");
    if (!point) return;
    const segment = state.transcript[Number(point.dataset.index)];
    if (segment) seekTo(segment.start, { play: true });
  });

  elements.transcriptList.addEventListener("pointerdown", (event) => {
    const word = event.target.closest(".line-word");
    if (!word || (event.button !== undefined && event.button !== 0)) return;
    hideWordPreview();
    state.phrasePointer = {
      pointerId: event.pointerId,
      startWord: word,
      lastWord: word,
      startX: event.clientX,
      startY: event.clientY,
      pointerType: event.pointerType,
      moved: false,
    };
    if (typeof word.setPointerCapture === "function") word.setPointerCapture(event.pointerId);
  });

  elements.transcriptList.addEventListener("pointermove", (event) => {
    const active = state.phrasePointer;
    if (!active || active.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - active.startX;
    const deltaY = event.clientY - active.startY;
    if (Math.hypot(deltaX, deltaY) < 7) return;
    if (active.pointerType !== "mouse" && Math.abs(deltaX) < Math.abs(deltaY)) return;
    const candidate = document.elementFromPoint(event.clientX, event.clientY)?.closest(".line-word");
    if (!candidate || candidate.closest(".line-copy") !== active.startWord.closest(".line-copy")) return;
    active.lastWord = candidate;
    active.moved = candidate !== active.startWord;
    if (active.moved) {
      event.preventDefault();
      updatePhraseRange(active.startWord, candidate);
    }
  });

  elements.transcriptList.addEventListener("pointerup", (event) => {
    const active = state.phrasePointer;
    if (!active || active.pointerId !== event.pointerId) return;
    state.phrasePointer = null;
    const phrase = active.moved ? phraseFromWords(active.startWord, active.lastWord) : "";
    clearPhraseRange();
    if (!phrase) return;
    const nativeSelection = window.getSelection();
    if (nativeSelection && !nativeSelection.isCollapsed) nativeSelection.removeAllRanges();
    state.suppressWordClick = true;
    window.setTimeout(() => { state.suppressWordClick = false; }, 0);
    lookupDefinition(phrase, Number(active.startWord.dataset.index));
  });

  elements.transcriptList.addEventListener("pointercancel", () => {
    state.phrasePointer = null;
    clearPhraseRange();
  });

  elements.transcriptList.addEventListener("click", (event) => {
    if (state.suppressWordClick) {
      state.suppressWordClick = false;
      return;
    }
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) {
      lookupSelectedPhrase();
      return;
    }
    const word = subtitleLookupTarget(event.target);
    if (word && !word.closest("#transcriptList")) return;
    if (word) {
      lookupDefinition(word.dataset.selection, Number(word.dataset.index));
      return;
    }
    const translation = event.target.closest(".line-translation");
    if (translation) {
      revealTranslation(Number(translation.dataset.index));
      return;
    }
    const item = event.target.closest(".transcript-item");
    if (!item) return;
    const index = Number(item.dataset.index);
    const segment = state.transcript[index];
    if (segment) seekTo(segment.start, { play: true });
  });
  elements.transcriptList.addEventListener("pointerup", () => window.setTimeout(lookupSelectedPhrase, 0));
  elements.transcriptList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = subtitleLookupTarget(event.target);
    if (!target) return;
    event.preventDefault();
    lookupDefinition(target.dataset.selection, Number(target.dataset.index));
  });

  elements.workspaceView.addEventListener("mouseover", (event) => {
    const target = subtitleLookupTarget(event.target);
    if (target) scheduleHoverLookup(target, event);
  });
  elements.workspaceView.addEventListener("mouseout", (event) => {
    const target = subtitleLookupTarget(event.target);
    const related = subtitleLookupTarget(event.relatedTarget);
    if (related === target) return;
    if (target === state.hoverLookupTarget) clearHoverLookup();
    if (target === state.hoverLookupCandidate) {
      clearHoverLookupTimer();
      state.hoverLookupCandidate = null;
      state.hoverLookupPoint = null;
    }
    if (related) scheduleHoverLookup(related, event);
  });
  elements.workspaceView.addEventListener("pointermove", (event) => {
    const target = subtitleLookupTarget(event.target);
    if (!target) {
      if (state.hoverLookupCandidate || state.hoverLookupTarget) clearHoverLookup();
      return;
    }
    if (state.hoverLookupTarget && target !== state.hoverLookupTarget) {
      clearHoverLookup();
      scheduleHoverLookup(target, event);
      return;
    }
    if (target !== state.hoverLookupCandidate || !state.hoverLookupPoint) return;
    const distance = Math.hypot(
      event.clientX - state.hoverLookupPoint.x,
      event.clientY - state.hoverLookupPoint.y
    );
    if (distance >= HOVER_MOTION_TOLERANCE_PX) scheduleHoverLookup(target, event);
  });
  elements.workspaceView.addEventListener("mouseleave", () => clearHoverLookup());
  window.addEventListener("blur", () => clearHoverLookup());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearHoverLookup();
  });
  elements.workspaceView.addEventListener("focusin", (event) => {
    const word = subtitleLookupTarget(event.target);
    if (word) scheduleWordPreview(word);
  });
  elements.workspaceView.addEventListener("focusout", (event) => {
    if (event.target === state.wordPreviewTarget) hideWordPreview();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".tuning-menu")) closeTuningPopovers();
    if (!event.target.closest("[data-font-select]")) closeFontSelects();
    if (!event.target.closest(".custom-color-picker")) closeColorPicker();
    if (
      !elements.dictionaryCard.classList.contains("is-hidden")
      && !event.target.closest("#dictionaryCard")
      && !event.target.closest(".line-word, .line-phrase, .caption-word, .caption-phrase, #analysisButton, #playButton, #videoStage")
    ) closeDictionary();
    if (
      !elements.analysisCard.classList.contains("is-hidden")
      && !event.target.closest("#analysisCard")
      && !event.target.closest("#analysisButton, .line-word, .line-phrase, .caption-word, .caption-phrase, #playButton, #videoStage")
    ) closeSentenceAnalysis();
  });

  syncAppViewportHeight();
  window.addEventListener("resize", syncAppViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", syncAppViewportHeight, { passive: true });

  initializeFontSelects();
  applySubtitleStyle();
  setPlaybackSpeed(SPEEDS.indexOf(state.speed));
  setVolume(state.volume);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && (
      !elements.subtitleColorPicker.classList.contains("is-hidden")
      || document.querySelector(".font-select-popover:not(.is-hidden)")
    )) {
      event.preventDefault();
      closeColorPicker();
      closeFontSelects();
      return;
    }
    if (event.key === "Escape" && !elements.aiSettingsModal.classList.contains("is-hidden")) {
      event.preventDefault();
      closeAiSettings();
      return;
    }
    if (event.key === "Escape" && (!elements.speedPopover.classList.contains("is-hidden") || !elements.volumePopover.classList.contains("is-hidden"))) {
      closeTuningPopovers();
      return;
    }
    if (elements.workspaceView.classList.contains("is-hidden")) return;
    if (event.key === "Escape" && !elements.dictionaryCard.classList.contains("is-hidden")) {
      event.preventDefault();
      closeDictionary();
      return;
    }
    if (event.key === "Escape" && !elements.analysisCard.classList.contains("is-hidden")) {
      event.preventDefault();
      closeSentenceAnalysis();
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLSelectElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLButtonElement
      || target.isContentEditable
    ) return;

    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    }
    if (event.code === "ArrowLeft") {
      event.preventDefault();
      jumpSentence(-1);
    }
    if (event.code === "ArrowRight") {
      event.preventDefault();
      jumpSentence(1);
    }
  });

  state.ticker = window.setInterval(tickPlayback, 100);
  detectChromeTranslationAvailability();
  loadLanguageCapabilities();
  updatePlaybackUI(0, true);
})();
