# VReply

Turn subtitled YouTube videos into line-by-line listening and shadowing practice.

VReply is a local-first learning tool for English and Spanish. Paste a video link to listen closely with synchronized subtitles, loop individual sentences, record shadowing attempts, look up words, and review saved vocabulary. The core experience requires no account, frontend build tools, or third-party Python packages.

## Latest Updates

The current version is `v3.3.0`. This release includes:

- **Chinese and English interface languages**: switch the website controls and interface copy independently of the learning language and subtitle translation language; the preference is saved in the browser.
- **Shadowing practice**: choose from Listen & Repeat, Text Guidance, Delayed Shadowing, and No-Subtitle Challenge; select a microphone, record your voice, and compare it with the original audio.
- **Practice feedback**: when browser capabilities permit, receive reference metrics for content completeness, fluency, rhythm similarity, speaking rate, pauses, and word error rate. Scores use browser speech recognition and timing alignment and are not professional pronunciation assessments.
- **Themes and responsive UI**: use Night, Day, or System themes across the practice workspace, settings, overview, saved words, and narrow-screen layouts.
- **Session recovery**: reopening or refreshing the page restores the last video, learning language, and playback position. Learning time, saved words, subtitle styling, interface language, and practice preferences stay in local browser storage.
- **Improved subtitle experience**: word highlighting follows the current spoken position while sentence seeking, search, export, auto-follow, and sentence looping remain available.

## Interface Preview

### Listening

The video, current sentence, and line-by-line transcript share one practice workspace. Bilingual subtitles, search, looping, and playback speed remain within easy reach.

![VReply listening interface in the Day theme](assets/vreply-listening-preview.jpg)

### Shadowing

Switch from Listening to Shadowing to play the current subtitle line, record your response, and practice sentence by sentence.

![VReply shadowing interface in the Day theme](assets/vreply-shadowing-preview.jpg)

## Features

- Chinese and English website interface languages
- English and Spanish learning modes
- Synchronized subtitles, word-level highlighting, sentence seeking, previous/next sentence navigation, and sentence looping
- 0.5×–3.0× playback speed, volume control, and subtitle auto-follow
- Listening mode and four shadowing practice modes
- In-browser recording, original/recording comparison, and shadowing feedback
- Transcript search, text export, saved words, and learning-time tracking
- Local English dictionary with US/UK pronunciation; Spain/Mexico pronunciation for Spanish
- Bilingual subtitles through Chrome on-device translation or a custom model API
- Optional AI features: contextual dictionary lookup, sentence analysis, subtitle translation, and video overviews
- Night, Day, and System themes

## Quick Start

Requirements: Python 3.10+ and a modern desktop browser with access to YouTube.

```bash
git clone https://github.com/JaylenVen/VReply.git
cd VReply
python server.py
```

After the server starts, open the address shown in the terminal, choose a learning language, and import a YouTube video that has subtitles in that language.

> VReply reads subtitles already provided with the video; it does not generate subtitles through speech recognition. Videos without subtitles in the selected language, with regional restrictions, or requiring sign-in may not work.

### Browser Requirements for Shadowing

Recording requires microphone permission and a page served from `localhost` or HTTPS. Full word-level and fluency feedback also depends on Web Speech Recognition support. On unsupported browsers, recording and playback still work, but complete recognition metrics are unavailable. The latest Chrome or Edge is recommended.

## Translation and AI

Core listening and shadowing practice do not require a model API. For bilingual subtitles, choose one of these options in **Settings**:

- **Chrome on-device translation**: uses the browser's built-in Translator API without an API key; VReply checks availability automatically.
- **Custom model API**: supports endpoints compatible with OpenAI Chat Completions.

You can also configure the model through environment variables:

| Variable | Description |
| --- | --- |
| `VREPLY_LLM_BASE_URL` | API base URL |
| `VREPLY_LLM_API_KEY` | API key |
| `VREPLY_LLM_MODEL` | Model name |
| `VREPLY_HOST` | Server bind address |
| `VREPLY_PORT` | Server port |

An API key entered in the page is stored only in the current server process and is never returned to the browser by the configuration endpoint. The configuration disappears when the server stops. Never commit API keys or expose the server directly to the public internet without authentication and access controls.

## Development

```bash
python -m unittest -v
node --check app.js
node --check i18n.js
```

VReply includes a compact dictionary derived from [ECDICT](https://github.com/skywind3000/ECDICT). To rebuild it from an ECDICT CSV file:

```bash
python scripts/build_local_dictionary.py path/to/ecdict.csv
```

ECDICT data is distributed under the MIT License. See [`third_party/ECDICT-LICENSE.txt`](third_party/ECDICT-LICENSE.txt) for the license text.

## License and Contributing

VReply source code is available under the [MIT License](LICENSE). The bundled ECDICT data is also under the MIT License, with its license stored separately at [`third_party/ECDICT-LICENSE.txt`](third_party/ECDICT-LICENSE.txt).

Before opening an issue or pull request, read the [contribution guide](CONTRIBUTING.md). Report security issues privately according to the [security policy](SECURITY.md); do not disclose vulnerability details or API keys in public.
