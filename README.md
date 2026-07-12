# VReply

VReply is a polished, dependency-free prototype for turning a YouTube video into an English speaking practice session. It includes word-timed transcript tracking, contextual AI dictionary lookup, on-demand Simplified Chinese translations, click-to-seek, line looping, playback speed, search, and transcript download.

## Run locally

```powershell
python server.py
```

Then open `http://127.0.0.1:4173`.

## Transcription integration

The included dependency-free server extracts English captions that a YouTube video makes available. YouTube word offsets are preserved when present, and rolling auto-caption windows are normalized into non-overlapping transcript lines. Videos without an existing English caption track need a real ASR service.

## AI dictionary and translations

The dictionary and translation endpoints use OpenAI's Responses API from the server. Keep the key out of browser code and set it before starting VReply:

```powershell
$env:OPENAI_API_KEY="your-server-side-key"
python server.py
```

The default language model is `gpt-5.4-mini`. Override it when needed with `VREPLY_LLM_MODEL`. `VREPLY_LLM_API_KEY` is also accepted as a VReply-specific alternative to `OPENAI_API_KEY`.

Without a configured key, video playback, synced captions, search, and looping continue to work. The translation toggle is disabled and dictionary clicks explain how to enable the AI service; VReply never invents fallback definitions.

In the transcript, click a word for a contextual definition or drag horizontally across consecutive words to look up a phrase. Each Chinese translation stays blurred until clicked; the **译文** control reveals or hides translations globally and loads only the visible lines first.

To connect a different ASR service, change this before `app.js` loads:

```html
<script>
  window.VREPLY_TRANSCRIBE_ENDPOINT = "/api/transcribe";
</script>
```

The endpoint receives:

```json
{ "url": "https://www.youtube.com/watch?v=..." }
```

and returns timed segments:

```json
{
  "transcriptId": "opaque-server-reference",
  "segments": [
    {
      "id": 1,
      "start": 0,
      "end": 4.2,
      "text": "First spoken line.",
      "words": [
        { "text": "First", "start": 0, "end": 1.1 }
      ]
    }
  ]
}
```

The browser sends only the opaque transcript reference, segment IDs, and the selected word or phrase to `/api/translate` and `/api/dictionary`. The server retrieves the surrounding transcript context, validates that selections came from the requested line, caches successful results, and never exposes the API key to the browser.

The server binds to `127.0.0.1` by default. Before exposing it beyond the local machine, add authentication, per-user rate limits, request budgets, durable transcript storage, and terms-of-service checks. Production use should also add provider-specific video adapters and a queued ASR worker for captionless/direct media. Keep the server's strict URL validation and canonical upstream URL construction when extending it.
