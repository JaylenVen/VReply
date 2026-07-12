(function () {
  "use strict";

  const DEFAULT_DURATION = 150;
  const SPEEDS = [0.75, 1, 1.25, 1.5];
  const TRANSLATION_ENGINE_KEY = "vreply:translation-engine";

  function initialTranslationEngine() {
    try {
      const saved = localStorage.getItem(TRANSLATION_ENGINE_KEY);
      if (saved === "chrome" || saved === "api") return saved;
    } catch (_error) {
      // Storage can be unavailable in privacy-focused browsing modes.
    }
    return "Translator" in self ? "chrome" : "api";
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
    translationEngineChrome: document.getElementById("translationEngineChrome"),
    translationEngineApi: document.getElementById("translationEngineApi"),
    chromeEngineOption: document.getElementById("chromeEngineOption"),
    chromeTranslationStatus: document.getElementById("chromeTranslationStatus"),
    apiSettingsFields: document.getElementById("apiSettingsFields"),
    urlForm: document.getElementById("urlForm"),
    videoUrl: document.getElementById("videoUrl"),
    urlField: document.getElementById("urlField"),
    urlError: document.getElementById("urlError"),
    projectTitle: document.getElementById("projectTitle"),
    videoMount: document.getElementById("videoMount"),
    videoPlaceholder: document.getElementById("videoPlaceholder"),
    captionOverlay: document.getElementById("captionOverlay"),
    captionText: document.getElementById("captionText"),
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
    speedButton: document.getElementById("speedButton"),
    muteButton: document.getElementById("muteButton"),
    loopButton: document.getElementById("loopButton"),
    theaterButton: document.getElementById("theaterButton"),
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
    languageStatus: document.getElementById("languageStatus"),
    dictionaryCard: document.getElementById("dictionaryCard"),
    dictionaryClose: document.getElementById("dictionaryClose"),
    dictionaryTerm: document.getElementById("dictionaryTerm"),
    dictionaryMeta: document.getElementById("dictionaryMeta"),
    dictionaryStatus: document.getElementById("dictionaryStatus"),
    dictionaryContent: document.getElementById("dictionaryContent"),
    dictionaryMeaning: document.getElementById("dictionaryMeaning"),
    dictionaryContext: document.getElementById("dictionaryContext"),
    dictionaryExampleBlock: document.getElementById("dictionaryExampleBlock"),
    dictionaryExample: document.getElementById("dictionaryExample"),
    dictionaryExampleTranslation: document.getElementById("dictionaryExampleTranslation"),
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
    muted: false,
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
    translationObserver: null,
    dictionaryCache: new Map(),
    dictionaryController: null,
    dictionaryRequestId: 0,
    phrasePointer: null,
    suppressWordClick: false,
  };

  let youTubeApiPromise = null;

  function parseVideoUrl(value) {
    let raw = String(value || "").trim();
    if (!raw) return { error: "Paste a video link to begin." };
    if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

    let url;
    try {
      url = new URL(raw);
    } catch (_error) {
      return { error: "That link does not look quite right." };
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
      error: "VReply currently supports YouTube links.",
    };
  }

  async function startImport(rawUrl) {
    const source = parseVideoUrl(rawUrl);
    if (source.error) {
      showFieldError(source.error);
      return;
    }

    clearFieldError();
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
    state.dictionaryCache.clear();
    state.phrasePointer = null;
    state.suppressWordClick = false;
    if (state.translationTimer) window.clearTimeout(state.translationTimer);
    state.translationTimer = null;
    if (state.translationObserver) state.translationObserver.disconnect();
    state.simulatedPlayback = false;
    setPlaying(false);
    cleanupPlayer();
    closeDictionary();
    updateTranslationToggle();

    elements.landingView.classList.add("is-hidden");
    elements.workspaceView.classList.remove("is-hidden");
    elements.aiSettingsButton.classList.remove("is-hidden");
    elements.newVideoButton.classList.remove("is-hidden");
    elements.transcriptSkeleton.classList.remove("is-hidden");
    elements.transcriptList.replaceChildren();
    elements.transcriptEmpty.classList.add("is-hidden");
    elements.transcriptSearch.value = "";
    elements.searchRow.classList.add("is-hidden");
    elements.searchResultCount.textContent = "0";
    elements.captionOverlay.classList.remove("is-visible");
    elements.extractOverlay.classList.remove("is-complete");
    elements.extractOverlay.classList.remove("has-error");
    elements.extractProgress.style.width = "10%";
    elements.workspaceView.setAttribute("aria-busy", "true");
    setInteractiveReady(false);

    elements.projectTitle.textContent = "Imported video";
    elements.transcriptCount.textContent = "0";

    mountVideo(source, token);
    fetchVideoTitle(source, token);

    const transcriptPromise = resolveTranscript(source.url);
    const phases = [
      {
        progress: 28,
        title: "Opening the source…",
        detail: "The video is ready. Listening for every voice.",
        wait: 290,
      },
      {
        progress: 59,
        title: "Hearing the conversation…",
        detail: "Separating natural phrases from pauses and music.",
        wait: 390,
      },
      {
        progress: 86,
        title: "Timing every sentence…",
        detail: "Matching each line to the exact playback moment.",
        wait: 410,
      },
      {
        progress: 92,
        title: "Finishing the transcript…",
        detail: "Checking the timing before your practice begins.",
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
    updatePlaybackUI(0, true);

    elements.extractTitle.textContent = "Your transcript is ready.";
    elements.extractDetail.textContent = "You can now listen, jump, loop and speak along.";
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
          let message = "The transcription service could not read this video.";
          try {
            const failure = await response.json();
            if (typeof failure.error === "string") message = failure.error;
            else if (failure.error && failure.error.message) message = String(failure.error.message);
          } catch (_error) {
            // Keep the user-facing fallback message.
          }
          throw new Error(message);
        }
        const payload = await response.json();
        const segments = normalizeSegments(payload.segments);
        const transcriptId = typeof payload.transcriptId === "string" ? payload.transcriptId : null;
        if (segments.length && transcriptId) return { segments, transcriptId };
        throw new Error("No spoken English captions were found for this video.");
      } catch (error) {
        if (error.name === "AbortError") {
          throw new Error("Transcription took too long. Please try again.");
        }
        throw error;
      } finally {
        window.clearTimeout(timeout);
      }
    }

    throw new Error("The transcription service is not configured.");
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
      elements.muteButton,
      elements.loopButton,
      elements.followToggle,
      elements.searchButton,
      elements.downloadButton,
    ].forEach((control) => {
      control.disabled = !ready;
    });
    updateTranslationToggle();
  }

  function showTranscriptionFailure(error) {
    const message = error && error.message
      ? error.message
      : "VReply could not create a transcript for this source.";
    state.transcript = [];
    state.transcriptId = null;
    state.activeIndex = -1;
    elements.transcriptSkeleton.classList.add("is-hidden");
    elements.transcriptCount.textContent = "0";
    elements.workspaceView.setAttribute("aria-busy", "false");
    elements.extractOverlay.classList.add("has-error");
    elements.extractProgress.style.width = "100%";
    elements.extractTitle.textContent = "We couldn’t create this transcript.";
    elements.extractDetail.textContent = message;
    setInteractiveReady(false);
    showToast("Transcript unavailable", message);
  }

  function mountVideo(source, token) {
    state.playerKind = source.kind;
    state.playerReady = false;
    elements.videoMount.replaceChildren();
    elements.videoPlaceholder.classList.remove("is-hidden");

    if (source.kind === "direct") {
      const video = document.createElement("video");
      video.src = source.url;
      video.preload = "metadata";
      video.playsInline = true;
      video.setAttribute("aria-label", "Imported video");
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
              disableYouTubeCaptions(event.target);
              if (state.muted) event.target.mute();
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
      script.onerror = () => reject(new Error("YouTube player could not load"));
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
    showToast("Practice mode is ready", "The source preview is blocked, so controls use the transcript timeline.");
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
    elements.playButton.setAttribute("aria-label", state.playing ? "Pause video" : "Play video");
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

    if (!state.transcript.length) return;
    const nextIndex = findActiveSegment(time);
    if (force || nextIndex !== state.activeIndex) setActiveSegment(nextIndex);
    updateCaptionWord(time);
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
    const previous = elements.transcriptList.querySelector(".transcript-item.is-active");
    if (previous) {
      previous.classList.remove("is-active");
      previous.removeAttribute("aria-current");
    }

    if (index < 0 || !state.transcript[index]) {
      state.activeIndex = -1;
      state.lastCaptionWord = -1;
      elements.captionOverlay.classList.remove("is-visible");
      return;
    }

    state.activeIndex = index;
    state.lastCaptionWord = -1;
    const item = elements.transcriptList.querySelector(`.transcript-item[data-index="${index}"]`);
    if (item) {
      item.classList.add("is-active");
      item.setAttribute("aria-current", "true");
      if (state.autoFollow && !elements.transcriptSearch.value.trim()) {
        item.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    const segment = state.transcript[index];
    elements.captionOverlay.classList.add("is-visible");
    renderCaptionWords(segment);
  }

  function renderCaptionWords(segment) {
    elements.captionText.replaceChildren();
    const fallbackTokens = String(segment.text).split(/\s+/).filter(Boolean);
    const duration = segment.end - segment.start;
    const words = segment.words.length === fallbackTokens.length
      ? segment.words
      : fallbackTokens.map((text, index) => ({
          text,
          start: segment.start + (duration * index) / fallbackTokens.length,
          end: segment.start + (duration * (index + 1)) / fallbackTokens.length,
        }));

    words.forEach((word, index) => {
        const span = document.createElement("span");
        span.className = "caption-word";
        span.dataset.word = String(index);
        span.dataset.start = String(word.start);
        span.dataset.end = String(word.end);
        span.textContent = index === words.length - 1 ? word.text : `${word.text} `;
        elements.captionText.appendChild(span);
      });
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
      time.setAttribute("aria-label", `Play line ${index + 1} at ${formatTime(segment.start)}`);

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

  function appendLookupWords(container, text, lineIndex) {
    const value = String(text || "");
    if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
      const segmenter = new Intl.Segmenter("en", { granularity: "word" });
      Array.from(segmenter.segment(value)).forEach((part) => {
        appendLookupPart(container, part.segment, Boolean(part.isWordLike), lineIndex);
      });
      return;
    }

    const parts = value.match(/\s+|[\p{L}\p{N}]+(?:['’.-][\p{L}\p{N}]+)*|[^\s]/gu) || [];
    parts.forEach((part) => appendLookupPart(container, part, /[\p{L}\p{N}]/u.test(part), lineIndex));
  }

  function appendLookupPart(container, text, isWordLike, lineIndex) {
    if (!isWordLike) {
      container.appendChild(document.createTextNode(text));
      return;
    }
    const word = document.createElement("span");
    word.className = "line-word";
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
      return "Unavailable in this browser. Use desktop Chrome 138 or newer.";
    }
    if (state.chromeTranslationAvailability === "checking") return "Checking browser support…";
    if (state.chromeTranslationAvailability === "downloading") {
      return `Downloading English–Chinese language pack… ${state.chromeDownloadProgress}%`;
    }
    if (state.chromeTranslationAvailability === "downloadable") {
      return "Supported. The language pack downloads on first use.";
    }
    if (state.chromeTranslationAvailability === "error") {
      return "Language pack setup failed. Click translation to try again.";
    }
    return "Ready on this device. Subtitle text stays in the browser.";
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
    elements.aiBaseUrl.required = engine === "api";
    elements.aiModel.required = engine === "api";
  }

  function updateTranslationToggle() {
    const available = translationEngineAvailable();
    const enabled = state.interactiveReady && available && Boolean(state.transcriptId);
    elements.translationToggle.disabled = !enabled;
    elements.translationToggle.classList.toggle("is-active", state.showTranslations);
    elements.translationToggle.setAttribute("aria-pressed", String(state.showTranslations));
    if (state.translationEngine === "chrome") {
      elements.translationToggle.title = available
        ? "使用 Chrome 内置翻译显示或隐藏简体中文译文"
        : chromeAvailabilityText();
      elements.languageStatus.textContent = `Chrome 内置翻译：${chromeAvailabilityText()}`;
    } else {
      elements.translationToggle.title = state.languageAvailable
        ? "使用自定义 API 显示或隐藏简体中文译文"
        : "请打开 Translation 设置并配置模型 API";
      elements.languageStatus.textContent = state.languageAvailable
        ? "自定义 API 翻译已就绪。"
        : "API 翻译尚未配置，请打开 Translation 设置。";
    }
    elements.chromeTranslationStatus.textContent = chromeAvailabilityText();
    elements.chromeEngineOption.classList.toggle(
      "is-unavailable",
      state.chromeTranslationAvailability === "unavailable"
    );
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
        ? `Translation for line ${index + 1} is shown by the global control`
        : `${revealed ? "Hide" : "Show"} translation for line ${index + 1}`
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

  function clearTranslationResults() {
    state.translationControllers.forEach((controller) => controller.abort());
    state.translationControllers.clear();
    if (state.translationTimer) window.clearTimeout(state.translationTimer);
    state.translationTimer = null;
    state.translationQueue.clear();
    state.translationInFlight.clear();
    state.translationErrors.clear();
    state.translations.clear();
    state.revealedTranslations.clear();
    state.showTranslations = false;
    elements.transcriptList.querySelectorAll(".line-translation").forEach((node) => {
      updateTranslationNode(node, Number(node.dataset.index));
    });
  }

  function setTranslationEngine(engine) {
    if (engine !== "chrome" && engine !== "api") return;
    if (state.translationEngine !== engine) {
      state.translationEngine = engine;
      clearTranslationResults();
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
      showToast("API 翻译尚未配置", "请打开 Translation 设置填写 API 信息。");
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
      if (state.showTranslations) {
        const nodeRect = node.getBoundingClientRect();
        const scrollRect = elements.transcriptScroll.getBoundingClientRect();
        if (nodeRect.bottom >= scrollRect.top - 120 && nodeRect.top <= scrollRect.bottom + 120) {
          queueTranslation(index);
        }
      }
    });
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
    if (state.translationTimer) return;
    state.translationTimer = window.setTimeout(flushTranslationQueue, 45);
  }

  async function flushTranslationQueue() {
    state.translationTimer = null;
    const indices = Array.from(state.translationQueue).slice(0, 20);
    indices.forEach((index) => {
      state.translationQueue.delete(index);
      state.translationInFlight.add(index);
      updateTranslationNodes(index);
    });
    if (!indices.length) return;
    const token = state.loadToken;
    const transcriptId = state.transcriptId;
    const engine = state.translationEngine;
    const controller = engine === "api" ? new AbortController() : null;
    if (controller) state.translationControllers.add(controller);
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
      }
    } catch (error) {
      if (error.name !== "AbortError" && token === state.loadToken && transcriptId === state.transcriptId) {
        indices
          .filter((index) => !state.translations.has(index))
          .forEach((index) => state.translationErrors.set(index, error.message));
      }
    } finally {
      if (controller) state.translationControllers.delete(controller);
      if (token !== state.loadToken || transcriptId !== state.transcriptId || engine !== state.translationEngine) return;
      indices.forEach((index) => {
        state.translationInFlight.delete(index);
        updateTranslationNodes(index);
      });
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
      throw new Error(message ? String(message) : fallback);
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

  function openAiSettings() {
    const config = state.llmConfig || {};
    elements.aiBaseUrl.value = config.baseUrl || "https://api.deepseek.com";
    elements.aiModel.value = config.model || "deepseek-v4-flash";
    elements.aiApiKey.value = "";
    elements.aiSettingsError.textContent = "";
    syncTranslationSettingsForm();
    elements.aiConfigStatus.textContent = state.translationEngine === "chrome"
      ? "Chrome translation selected"
      : state.languageAvailable
        ? `API connected · ${config.model || "model configured"}`
        : "API not configured";
    elements.aiKeyHint.textContent = config.hasApiKey
      ? "A key is configured, but is never returned to the browser. Paste a key to replace it."
      : "The key stays in server memory and is cleared when the server stops.";
    elements.aiSettingsModal.classList.remove("is-hidden");
    window.requestAnimationFrame(() => {
      if (state.translationEngine === "chrome") elements.translationEngineChrome.focus();
      else elements.aiBaseUrl.focus();
    });
  }

  function closeAiSettings() {
    elements.aiSettingsModal.classList.add("is-hidden");
    elements.aiSettingsError.textContent = "";
  }

  async function saveAiSettings(event) {
    event.preventDefault();
    const engine = elements.translationEngineChrome.checked ? "chrome" : "api";
    elements.aiSettingsError.textContent = "";
    elements.aiSettingsSave.disabled = true;
    elements.aiSettingsSave.textContent = "Saving…";
    try {
      if (engine === "chrome") {
        if (state.chromeTranslationAvailability === "unavailable") {
          throw new Error("此浏览器不支持 Chrome 内置翻译，请选择 Custom model API。");
        }
        setTranslationEngine("chrome");
      } else {
        const config = state.llmConfig || {};
        const sameExistingConfig = state.languageAvailable
          && elements.aiBaseUrl.value.trim() === String(config.baseUrl || "")
          && elements.aiModel.value.trim() === String(config.model || "");
        if (!elements.aiApiKey.value.trim() && !sameExistingConfig) {
          throw new Error("使用 API 翻译时，请填写 API base URL、模型名称和 API key。");
        }
        if (!elements.aiBaseUrl.value.trim() || !elements.aiModel.value.trim()) {
          throw new Error("请填写 API base URL 和模型名称。");
        }
        if (!sameExistingConfig || elements.aiApiKey.value.trim()) {
          const response = await fetch("/api/llm-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              baseUrl: elements.aiBaseUrl.value,
              model: elements.aiModel.value,
              apiKey: elements.aiApiKey.value,
            }),
          });
          const payload = await readApiPayload(response, "AI configuration could not be saved.");
          applyLanguageCapabilities(payload);
        }
        setTranslationEngine("api");
      }
      closeAiSettings();
      showToast(
        "Translation settings saved",
        engine === "chrome" ? "Chrome will translate subtitles on this device." : `${state.llmConfig.model} will translate subtitles through the API.`
      );
    } catch (error) {
      elements.aiSettingsError.textContent = error.message;
    } finally {
      elements.aiSettingsSave.disabled = false;
      elements.aiSettingsSave.textContent = "Save settings";
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
    elements.dictionaryCard.classList.remove("is-hidden");
    elements.dictionaryCard.setAttribute("aria-busy", "true");
    elements.dictionaryTerm.textContent = selection;
    elements.dictionaryMeta.textContent = "";
    elements.dictionaryStatus.textContent = "正在读取当前语境…";
    elements.dictionaryStatus.classList.remove("is-error");
    elements.dictionaryContent.classList.add("is-hidden");
  }

  function closeDictionary() {
    state.dictionaryRequestId += 1;
    elements.dictionaryCard.classList.add("is-hidden");
    elements.dictionaryCard.removeAttribute("aria-busy");
    if (state.dictionaryController) state.dictionaryController.abort();
    state.dictionaryController = null;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) selection.removeAllRanges();
  }

  function showDictionaryError(message) {
    elements.dictionaryCard.setAttribute("aria-busy", "false");
    elements.dictionaryStatus.textContent = message;
    elements.dictionaryStatus.classList.add("is-error");
    elements.dictionaryContent.classList.add("is-hidden");
  }

  function renderDictionaryEntry(entry) {
    elements.dictionaryTerm.textContent = entry.headword || entry.selection;
    const source = entry.source === "local" ? `本地 · ${entry.dictionary || "ECDICT"}` : "AI 语境解释";
    elements.dictionaryMeta.textContent = [source, entry.partOfSpeech, entry.pronunciation].filter(Boolean).join(" · ");
    elements.dictionaryMeaning.textContent = entry.meaning;
    elements.dictionaryContext.textContent = entry.contextMeaning;
    elements.dictionaryExample.textContent = entry.example;
    elements.dictionaryExampleTranslation.textContent = entry.exampleTranslation;
    elements.dictionaryExampleBlock.classList.toggle(
      "is-hidden",
      !String(entry.example || "").trim() && !String(entry.exampleTranslation || "").trim()
    );
    elements.dictionaryStatus.textContent = "";
    elements.dictionaryStatus.classList.remove("is-error");
    elements.dictionaryContent.classList.remove("is-hidden");
    elements.dictionaryCard.setAttribute("aria-busy", "false");
  }

  async function lookupDefinition(selectionValue, index) {
    const selection = String(selectionValue || "").replace(/\s+/g, " ").trim();
    if (!selection || !state.transcript[index] || selection.length > 120) return;
    const requestId = ++state.dictionaryRequestId;
    if (state.dictionaryController) state.dictionaryController.abort();
    state.dictionaryController = null;
    openDictionary(selection);
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
    try {
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
      state.dictionaryCache.set(cacheKey, entry);
      renderDictionaryEntry(entry);
    } catch (error) {
      if (
        error.name !== "AbortError"
        && token === state.loadToken
        && requestId === state.dictionaryRequestId
      ) showDictionaryError(error.message);
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

  function cycleSpeed() {
    const currentIndex = SPEEDS.indexOf(state.speed);
    state.speed = SPEEDS[(currentIndex + 1) % SPEEDS.length];
    elements.speedButton.textContent = `${state.speed}×`;

    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      state.ytPlayer.setPlaybackRate(state.speed);
    }
    if (state.playerKind === "direct" && state.directPlayer) {
      state.directPlayer.playbackRate = state.speed;
    }
  }

  function toggleMute() {
    state.muted = !state.muted;
    elements.muteButton.classList.toggle("is-muted", state.muted);
    elements.muteButton.setAttribute("aria-label", state.muted ? "Unmute video" : "Mute video");

    if (state.playerKind === "youtube" && state.playerReady && state.ytPlayer) {
      if (state.muted) state.ytPlayer.mute();
      else state.ytPlayer.unMute();
    }
    if (state.playerKind === "direct" && state.directPlayer) {
      state.directPlayer.muted = state.muted;
    }
  }

  function toggleLoop() {
    state.loopLine = !state.loopLine;
    elements.loopButton.classList.toggle("is-active", state.loopLine);
    elements.loopButton.setAttribute("aria-pressed", String(state.loopLine));
    showToast(
      state.loopLine ? "Line loop on" : "Line loop off",
      state.loopLine ? "The current sentence will repeat automatically." : "Playback will continue normally."
    );
  }

  function toggleAutoFollow() {
    state.autoFollow = !state.autoFollow;
    elements.followToggle.classList.toggle("is-active", state.autoFollow);
    elements.followToggle.setAttribute("aria-pressed", String(state.autoFollow));
    if (state.autoFollow) setActiveSegment(state.activeIndex < 0 ? 0 : state.activeIndex);
  }

  function toggleTheater() {
    const enabled = elements.workspaceView.classList.toggle("is-theatre");
    elements.theaterButton.setAttribute("aria-pressed", String(enabled));
    elements.theaterButton.setAttribute("aria-label", enabled ? "Show transcript" : "Hide transcript");
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
    showToast("Transcript downloaded", "Your timed practice script is ready.");
  }

  function returnHome() {
    ++state.loadToken;
    setPlaying(false);
    cleanupPlayer();
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
    state.translationControllers.forEach((controller) => controller.abort());
    state.translationControllers.clear();
    if (state.translationTimer) window.clearTimeout(state.translationTimer);
    state.translationTimer = null;
    if (state.translationObserver) state.translationObserver.disconnect();
    closeDictionary();
    updateTranslationToggle();
    elements.videoMount.replaceChildren();
    elements.workspaceView.classList.add("is-hidden");
    elements.workspaceView.classList.remove("is-theatre");
    elements.landingView.classList.remove("is-hidden");
    elements.aiSettingsButton.classList.add("is-hidden");
    elements.newVideoButton.classList.add("is-hidden");
    elements.videoUrl.value = "";
    elements.transcriptSearch.value = "";
    elements.searchRow.classList.add("is-hidden");
    elements.searchResultCount.textContent = "0";
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

  elements.urlForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startImport(elements.videoUrl.value);
  });

  elements.videoUrl.addEventListener("input", clearFieldError);
  elements.aiSettingsButton.addEventListener("click", openAiSettings);
  elements.aiSettingsClose.addEventListener("click", closeAiSettings);
  elements.aiSettingsForm.addEventListener("submit", saveAiSettings);
  [elements.translationEngineChrome, elements.translationEngineApi].forEach((input) => {
    input.addEventListener("change", () => {
      syncTranslationSettingsForm(input.value);
      elements.aiConfigStatus.textContent = input.value === "chrome"
        ? chromeAvailabilityText()
        : state.languageAvailable ? "API connection is ready" : "API connection required";
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
  elements.playButton.addEventListener("click", togglePlay);
  elements.rewindButton.addEventListener("click", () => seekTo(state.currentTime - 5));
  elements.forwardButton.addEventListener("click", () => seekTo(state.currentTime + 5));
  elements.progressRange.addEventListener("input", (event) => seekTo(event.target.value));
  elements.speedButton.addEventListener("click", cycleSpeed);
  elements.muteButton.addEventListener("click", toggleMute);
  elements.loopButton.addEventListener("click", toggleLoop);
  elements.theaterButton.addEventListener("click", toggleTheater);
  elements.followToggle.addEventListener("click", toggleAutoFollow);
  elements.translationToggle.addEventListener("click", toggleTranslations);
  elements.dictionaryClose.addEventListener("click", closeDictionary);
  elements.searchButton.addEventListener("click", toggleSearch);
  elements.transcriptSearch.addEventListener("input", (event) => renderTranscript(event.target.value));
  elements.downloadButton.addEventListener("click", downloadTranscript);

  elements.transcriptList.addEventListener("pointerdown", (event) => {
    const word = event.target.closest(".line-word");
    if (!word || (event.button !== undefined && event.button !== 0)) return;
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
    const word = event.target.closest(".line-word");
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

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.aiSettingsModal.classList.contains("is-hidden")) {
      event.preventDefault();
      closeAiSettings();
      return;
    }
    if (elements.workspaceView.classList.contains("is-hidden")) return;
    if (event.key === "Escape" && !elements.dictionaryCard.classList.contains("is-hidden")) {
      event.preventDefault();
      closeDictionary();
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLInputElement
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
      seekTo(state.currentTime - 5);
    }
    if (event.code === "ArrowRight") {
      event.preventDefault();
      seekTo(state.currentTime + 5);
    }
  });

  state.ticker = window.setInterval(tickPlayback, 100);
  detectChromeTranslationAvailability();
  loadLanguageCapabilities();
  updatePlaybackUI(0, true);
})();
