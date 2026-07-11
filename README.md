# VReply

VReply is a lightweight web prototype for learning English with YouTube videos.

It combines synchronized English captions with contextual AI dictionary lookup, Chinese translation, sentence looping, playback controls, transcript search, and transcript download.

## Features

- YouTube video playback
- Synchronized English captions
- Word-level timing when available
- Click-to-seek transcript navigation
- Contextual word and phrase lookup
- On-demand Chinese translation
- Sentence looping
- Playback speed control
- Transcript search and download

## Run Locally

VReply requires Python 3 and uses a dependency-free local server.

```powershell
python server.py
```

Then open the link.

## AI Dictionary and Translation

AI-powered dictionary lookup and translation use the DeepSeek API on the server side.

Set your API key before starting VReply:

```powershell
$env:VREPLY_LLM_API_KEY="your API key"
$env:VREPLY_LLM_MODEL="deepseek-v4-flash"
python server.py
```

The API key is never exposed to the browser.

Without an API key, video playback, synchronized captions, search, and sentence looping still work.

## Caption Support

VReply extracts English captions already available from supported YouTube videos.

When word-level timing is available, it is preserved for transcript synchronization.

Videos without accessible English captions require an external ASR service.

## Custom ASR

A custom transcription endpoint can be configured before `app.js` loads:

```html
<script>
  window.VREPLY_TRANSCRIBE_ENDPOINT = "/api/transcribe";
</script>
```

The endpoint should accept:

```json
{
  "url": "https://www.youtube.com/watch?v=..."
}
```

and return timed transcript segments.

## Security

Do not store API keys in browser-side code or commit them to GitHub.

## Project Status

VReply is currently an experimental prototype under active development.
