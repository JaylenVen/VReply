import gzip
import io
import os
import json
import unittest
from unittest.mock import patch

import server


class UpstreamResponseTests(unittest.TestCase):
    class FakeResponse(io.BytesIO):
        def __init__(self, body: bytes, content_encoding: str = "") -> None:
            super().__init__(body)
            self.headers = {"Content-Encoding": content_encoding}

    def test_gzip_response_is_decompressed_with_decoded_size_limit(self) -> None:
        payload = b"caption data" * 20
        response = self.FakeResponse(gzip.compress(payload), "gzip")

        self.assertEqual(server._read_upstream_body(response, limit=len(payload)), payload)

    def test_gzip_response_rejects_decoded_body_over_limit(self) -> None:
        payload = b"caption data" * 20
        response = self.FakeResponse(gzip.compress(payload), "gzip")

        with self.assertRaises(server.APIError) as raised:
            server._read_upstream_body(response, limit=len(payload) - 1)

        self.assertEqual(raised.exception.code, "upstream_too_large")


class NormalizeJson3SegmentsTests(unittest.TestCase):
    def test_rolling_asr_cues_do_not_overlap_and_keep_word_offsets(self) -> None:
        payload = {
            "events": [
                {
                    "tStartMs": 4080,
                    "dDurationMs": 3800,
                    "segs": [
                        {"utf8": "Uh"},
                        {"utf8": " hello", "tOffsetMs": 200},
                        {"utf8": " everyone.", "tOffsetMs": 440},
                        {"utf8": " Jack", "tOffsetMs": 1560},
                    ],
                },
                {"tStartMs": 5830, "dDurationMs": 2050, "aAppend": 1, "segs": [{"utf8": "\n"}]},
                {
                    "tStartMs": 5840,
                    "dDurationMs": 3640,
                    "segs": [
                        {"utf8": "Manong."},
                        {"utf8": " I'm", "tOffsetMs": 400},
                    ],
                },
            ]
        }

        result = server.normalize_json3_segments(payload)

        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["end"], result[1]["start"])
        self.assertEqual(result[1]["end"], result[2]["start"])
        self.assertEqual(result[0]["text"], "Uh hello everyone.")
        self.assertEqual(result[1]["text"], "Jack Manong.")
        self.assertEqual([word["text"] for word in result[0]["words"]], ["Uh", "hello", "everyone."])
        self.assertEqual(result[0]["words"][0]["start"], 4.08)
        self.assertEqual(result[0]["words"][1]["start"], 4.28)
        self.assertEqual(result[1]["words"][-1]["end"], 6.24)

    def test_words_without_offsets_use_text_aware_nonuniform_timing(self) -> None:
        payload = {
            "events": [
                {
                    "tStartMs": 1000,
                    "dDurationMs": 3000,
                    "segs": [{"utf8": "I accelerate, then slow"}],
                }
            ]
        }

        result = server.normalize_json3_segments(payload)
        words = result[0]["words"]
        durations = [round(word["end"] - word["start"], 3) for word in words]

        self.assertEqual(words[0]["start"], 1.0)
        self.assertEqual(words[-1]["end"], 4.0)
        self.assertGreater(durations[1], durations[0])
        self.assertGreater(words[2]["start"] - words[1]["end"], words[1]["start"] - words[0]["end"])

    def test_native_word_starts_keep_variable_speed_and_trim_the_final_dwell(self) -> None:
        payload = {
            "events": [
                {
                    "tStartMs": 1000,
                    "dDurationMs": 3000,
                    "segs": [
                        {"utf8": "Start"},
                        {"utf8": " slowly,", "tOffsetMs": 280},
                        {"utf8": " then", "tOffsetMs": 760},
                        {"utf8": " race", "tOffsetMs": 880},
                        {"utf8": " now.", "tOffsetMs": 1010},
                    ],
                }
            ]
        }

        result = server.normalize_json3_segments(payload)
        words = result[0]["words"]

        self.assertEqual([word["start"] for word in words], [1.0, 1.28, 1.76, 1.88, 2.01])
        self.assertLess(words[-1]["end"], 2.7)
        self.assertLess(result[0]["end"], 2.7)

    def test_fragments_are_merged_until_sentence_punctuation(self) -> None:
        payload = {
            "events": [
                {"tStartMs": 0, "dDurationMs": 1000, "segs": [{"utf8": "We learned a"}]},
                {"tStartMs": 1000, "dDurationMs": 1000, "segs": [{"utf8": "lot about agents today."}]},
                {"tStartMs": 2000, "dDurationMs": 1000, "segs": [{"utf8": "Does it work?"}]},
                {"tStartMs": 3000, "dDurationMs": 1000, "segs": [{"utf8": "Yes, it does!"}]},
            ]
        }

        result = server.normalize_json3_segments(payload)

        self.assertEqual(
            [segment["text"] for segment in result],
            ["We learned a lot about agents today.", "Does it work?", "Yes, it does!"],
        )
        self.assertEqual(result[0]["start"], 0.0)
        self.assertEqual(result[0]["end"], 2.0)

    def test_common_abbreviation_does_not_end_a_sentence(self) -> None:
        payload = {
            "events": [
                {
                    "tStartMs": 0,
                    "dDurationMs": 6000,
                    "segs": [{"utf8": "Dr. Smith built it. It works."}],
                }
            ]
        }

        result = server.normalize_json3_segments(payload)

        self.assertEqual([segment["text"] for segment in result], ["Dr. Smith built it.", "It works."])

    def test_long_pause_is_a_safe_fallback_without_punctuation(self) -> None:
        payload = {
            "events": [
                {"tStartMs": 0, "dDurationMs": 1000, "segs": [{"utf8": "First spoken thought"}]},
                {"tStartMs": 3000, "dDurationMs": 1000, "segs": [{"utf8": "A new thought"}]},
            ]
        }

        result = server.normalize_json3_segments(payload)

        self.assertEqual([segment["text"] for segment in result], ["First spoken thought", "A new thought"])

    def test_fallback_boundary_does_not_split_a_source_caption_cue(self) -> None:
        first_line = " ".join("w" for _index in range(49))
        payload = {
            "events": [
                {"tStartMs": 0, "dDurationMs": 1000, "segs": [{"utf8": first_line}]},
                {
                    "tStartMs": 1000,
                    "dDurationMs": 1000,
                    "segs": [{"utf8": "so this time nothing goes wrong"}],
                },
                {"tStartMs": 2000, "dDurationMs": 1000, "segs": [{"utf8": "Next line."}]},
            ]
        }

        result = server.normalize_json3_segments(payload)

        self.assertEqual(len(result), 2)
        self.assertTrue(result[0]["text"].endswith("so this time nothing goes wrong"))
        self.assertEqual(result[1]["text"], "Next line.")
        self.assertEqual(result[1]["start"], 2.0)

    def test_untimed_words_do_not_stretch_across_a_long_caption_dwell(self) -> None:
        payload = {
            "events": [
                {
                    "tStartMs": index * 1000,
                    "dDurationMs": 1000,
                    "segs": [{"utf8": f"quick cue number {index}"}],
                }
                for index in range(4)
            ]
        }
        payload["events"].append(
            {
                "tStartMs": 4000,
                "dDurationMs": 10000,
                "segs": [{"utf8": "so this time nothing goes wrong."}],
            }
        )

        result = server.normalize_json3_segments(payload)
        last_word = result[-1]["words"][-1]

        self.assertLess(last_word["end"], 7.0)
        self.assertEqual(last_word["text"], "wrong.")

    def test_manual_text_can_use_nonuniform_timings_from_an_asr_track(self) -> None:
        primary = [
            {
                "id": 1,
                "start": 0.0,
                "end": 4.0,
                "text": "Start slowly, then race.",
                "words": [
                    {"text": "Start", "start": 0.0, "end": 1.0},
                    {"text": "slowly,", "start": 1.0, "end": 2.0},
                    {"text": "then", "start": 2.0, "end": 3.0},
                    {"text": "race.", "start": 3.0, "end": 4.0},
                ],
            }
        ]
        timing = [
            {
                "id": 1,
                "start": 0.0,
                "end": 1.2,
                "text": "Start slowly then race",
                "words": [
                    {"text": "Start", "start": 0.0, "end": 0.18},
                    {"text": "slowly", "start": 0.18, "end": 0.72},
                    {"text": "then", "start": 0.72, "end": 0.86},
                    {"text": "race", "start": 0.86, "end": 1.2},
                ],
            }
        ]

        alignment = server.align_word_timings(primary, timing)

        self.assertIsNotNone(alignment)
        aligned, coverage = alignment
        self.assertEqual(coverage, 1.0)
        self.assertEqual(
            [word["start"] for word in aligned[0]["words"]],
            [0.0, 0.18, 0.72, 0.86],
        )
        self.assertEqual(aligned[0]["text"], primary[0]["text"])


class CaptionTrackSelectionTests(unittest.TestCase):
    def test_innertube_can_use_android_context_without_watch_page_config(self) -> None:
        response = {"captions": {"playerCaptionsTracklistRenderer": {"captionTracks": []}}}

        with patch.object(
            server,
            "_post_json_bytes",
            return_value=json.dumps(response).encode(),
        ) as post:
            result = server.fetch_innertube_player("SVWmuJx0hHM")

        self.assertEqual(result, response)
        self.assertNotIn("key=", post.call_args.args[0])
        self.assertEqual(post.call_args.args[1]["context"]["client"]["clientName"], "ANDROID")

    def test_innertube_prefers_android_context_and_stops_when_it_has_captions(self) -> None:
        page_context = {"client": {"clientName": "WEB", "clientVersion": "1.0"}}
        response = {"captions": {"playerCaptionsTracklistRenderer": {"captionTracks": []}}}

        with patch.object(
            server,
            "extract_innertube_config",
            return_value=("test-key", page_context),
        ), patch.object(
            server,
            "_post_json_bytes",
            return_value=json.dumps(response).encode(),
        ) as post:
            result = server.fetch_innertube_player("SVWmuJx0hHM", "watch")

        self.assertEqual(result, response)
        self.assertEqual(post.call_count, 1)
        self.assertEqual(post.call_args.args[1]["context"]["client"]["clientName"], "ANDROID")

    def test_spanish_manual_track_wins_over_automatic_track(self) -> None:
        response = {
            "captions": {
                "playerCaptionsTracklistRenderer": {
                    "captionTracks": [
                        {"languageCode": "en", "baseUrl": "https://www.youtube.com/api/timedtext?en=1"},
                        {
                            "languageCode": "es",
                            "kind": "asr",
                            "baseUrl": "https://www.youtube.com/api/timedtext?es=auto",
                        },
                        {
                            "languageCode": "es-419",
                            "baseUrl": "https://www.youtube.com/api/timedtext?es=manual",
                        },
                    ]
                }
            }
        }

        selected = server.choose_caption_track(response, "es")

        self.assertEqual(selected["languageCode"], "es-419")

    def test_manual_track_can_borrow_word_timing_from_same_language_asr(self) -> None:
        manual = {
            "languageCode": "en",
            "baseUrl": "https://www.youtube.com/api/timedtext?manual=1",
        }
        automatic = {
            "languageCode": "en",
            "kind": "asr",
            "baseUrl": "https://www.youtube.com/api/timedtext?auto=1",
        }
        response = {
            "captions": {
                "playerCaptionsTracklistRenderer": {
                    "captionTracks": [manual, automatic],
                }
            }
        }

        selected = server.choose_word_timing_track(response, "en", manual)

        self.assertIs(selected, automatic)

    def test_missing_requested_language_has_a_specific_error(self) -> None:
        response = {
            "captions": {
                "playerCaptionsTracklistRenderer": {
                    "captionTracks": [{"languageCode": "en", "baseUrl": "https://example.test/en"}]
                }
            }
        }

        with self.assertRaises(server.APIError) as raised:
            server.choose_caption_track(response, "es")

        self.assertEqual(raised.exception.code, "es_captions_unavailable")

    def test_transcription_aligns_manual_text_to_optional_asr_word_timing(self) -> None:
        with server._CACHE_LOCK:
            server._CACHE.clear()
            server._TRANSCRIPT_INDEX.clear()
        response = {
            "videoDetails": {"title": "Variable pace", "lengthSeconds": "4"},
            "captions": {
                "playerCaptionsTracklistRenderer": {
                    "captionTracks": [
                        {
                            "languageCode": "en",
                            "baseUrl": "https://www.youtube.com/api/timedtext?manual=1",
                            "name": {"simpleText": "English"},
                        },
                        {
                            "languageCode": "en",
                            "kind": "asr",
                            "baseUrl": "https://www.youtube.com/api/timedtext?auto=1",
                        },
                    ]
                }
            },
        }
        manual = json.dumps(
            {
                "events": [
                    {
                        "tStartMs": 0,
                        "dDurationMs": 4000,
                        "segs": [{"utf8": "Start slowly, then race."}],
                    }
                ]
            }
        ).encode()
        timing = json.dumps(
            {
                "events": [
                    {
                        "tStartMs": 0,
                        "dDurationMs": 4000,
                        "segs": [
                            {"utf8": "Start"},
                            {"utf8": " slowly", "tOffsetMs": 180},
                            {"utf8": " then", "tOffsetMs": 720},
                            {"utf8": " race", "tOffsetMs": 860},
                        ],
                    }
                ]
            }
        ).encode()
        with patch.object(
            server,
            "fetch_innertube_player",
            return_value=response,
        ) as refresh, patch.object(
            server,
            "_fetch_bytes",
            side_effect=[manual, timing],
        ) as fetch:
            result = server.transcribe_youtube("https://youtu.be/SVWmuJx0hHM", "en")

        self.assertEqual(result["metadata"]["captions"]["wordTiming"], "aligned-asr")
        self.assertEqual(result["metadata"]["captions"]["wordTimingCoverage"], 1.0)
        self.assertEqual(
            [word["start"] for word in result["segments"][0]["words"]],
            [0.0, 0.18, 0.72, 0.86],
        )
        self.assertEqual(fetch.call_count, 2)
        refresh.assert_called_once()

    def test_transcript_cache_is_separated_by_learning_language(self) -> None:
        with server._CACHE_LOCK:
            server._CACHE.clear()
            server._TRANSCRIPT_INDEX.clear()
        response = {
            "videoDetails": {"title": "Bilingual sample", "lengthSeconds": "1"},
            "captions": {
                "playerCaptionsTracklistRenderer": {
                    "captionTracks": [
                        {
                            "languageCode": "en",
                            "baseUrl": "https://www.youtube.com/api/timedtext?lang=en",
                        },
                        {
                            "languageCode": "es",
                            "baseUrl": "https://www.youtube.com/api/timedtext?lang=es",
                        },
                    ]
                }
            },
        }
        captions = json.dumps({
            "events": [{"tStartMs": 0, "dDurationMs": 1000, "segs": [{"utf8": "Hello."}]}]
        }).encode()
        with patch.object(server, "extract_player_response", return_value=response), patch.object(
            server,
            "fetch_innertube_player",
            side_effect=server.APIError(502, "refresh_failed", "refresh failed"),
        ) as refresh, patch.object(
            server,
            "_fetch_bytes",
            side_effect=[b"watch", captions, b"watch", captions],
        ) as fetch:
            english = server.transcribe_youtube("https://youtu.be/SVWmuJx0hHM", "en")
            spanish = server.transcribe_youtube("https://youtu.be/SVWmuJx0hHM", "es")
            english_cached = server.transcribe_youtube("https://youtu.be/SVWmuJx0hHM", "en")

        self.assertEqual(english["metadata"]["captions"]["languageCode"], "en")
        self.assertEqual(spanish["metadata"]["captions"]["languageCode"], "es")
        self.assertNotEqual(english["transcriptId"], spanish["transcriptId"])
        self.assertTrue(english_cached["cached"])
        self.assertEqual(fetch.call_count, 4)
        self.assertEqual(refresh.call_count, 4)


class TranscriptCasingTests(unittest.TestCase):
    def test_transcript_wide_uppercase_is_converted_to_readable_case(self) -> None:
        texts = [
            ">> BREAKING NEWS OVERNIGHT, THE DEATH OF U.S. SENATOR LINDSEY GRAHAM.",
            "LET'S GET RIGHT TO JAY O'BRIEN, NOW IN WASHINGTON WITH THE DETAILS.",
            "I THINK THIS WAS STUNNING! IT CHANGED EVERYTHING.",
        ]
        segments = [
            {
                "id": index + 1,
                "start": float(index),
                "end": float(index + 1),
                "text": text,
                "words": [{"text": token, "start": 0.0, "end": 0.1} for token in text.split()],
            }
            for index, text in enumerate(texts)
        ]
        metadata = {"title": "Lindsey Graham: Jay O'Brien Reports from Washington", "author": "ABC News"}

        result = server.normalize_transcript_casing(segments, metadata)

        self.assertEqual(
            [segment["text"] for segment in result],
            [
                ">> Breaking news overnight, the death of U.S. senator Lindsey Graham.",
                "Let's get right to Jay O'Brien, now in Washington with the details.",
                "I think this was stunning! It changed everything.",
            ],
        )
        self.assertEqual(result[1]["words"][:4], [
            {"text": "Let's", "start": 0.0, "end": 0.1},
            {"text": "get", "start": 0.0, "end": 0.1},
            {"text": "right", "start": 0.0, "end": 0.1},
            {"text": "to", "start": 0.0, "end": 0.1},
        ])
        self.assertEqual(segments[0]["text"], texts[0])

    def test_mixed_case_transcript_is_left_unchanged(self) -> None:
        segments = [
            {"id": 1, "text": "This sentence is already easy to read."},
            {"id": 2, "text": "NASA uses uppercase because it is an acronym."},
            {"id": 3, "text": "A final normal sentence stays untouched."},
        ]

        result = server.normalize_transcript_casing(segments, {"title": "Normal Video"})

        self.assertIs(result, segments)

    def test_short_uppercase_emphasis_is_not_treated_as_an_uppercase_source(self) -> None:
        segments = [{"id": 1, "text": "THIS IS IMPORTANT!"}]

        result = server.normalize_transcript_casing(segments)

        self.assertIs(result, segments)


class LanguageServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        with server._CACHE_LOCK:
            server._CACHE.clear()
            server._TRANSCRIPT_INDEX.clear()
        with server._LANGUAGE_CACHE_LOCK:
            server._LANGUAGE_CACHE.clear()
        with server._LLM_CONFIG_LOCK:
            server._LLM_CONFIG.clear()

        self.transcript = {
            "segments": [
                {"id": 1, "start": 0.0, "end": 1.0, "text": "We turned the system on."},
                {"id": 2, "start": 1.0, "end": 2.0, "text": "The project can take off now."},
                {"id": 3, "start": 2.0, "end": 3.0, "text": "That result surprised everyone."},
            ],
            "metadata": {"captions": {"languageCode": "en"}},
        }
        self.transcript["transcriptId"] = server._make_transcript_id("SVWmuJx0hHM", self.transcript)
        server._cache_put("SVWmuJx0hHM", self.transcript)
        self.spanish_transcript = {
            "segments": [
                {"id": 1, "start": 0.0, "end": 1.0, "text": "Encendimos el sistema."},
                {"id": 2, "start": 1.0, "end": 2.0, "text": "El proyecto puede despegar ahora."},
                {"id": 3, "start": 2.0, "end": 3.0, "text": "Ese resultado sorprendió a todos."},
            ],
            "metadata": {"captions": {"languageCode": "es-419"}},
        }
        self.spanish_transcript["transcriptId"] = server._make_transcript_id(
            "SVWmuJx0hHM",
            self.spanish_transcript,
        )
        server._cache_put("SVWmuJx0hHM:es", self.spanish_transcript)

    def _env(self):
        return patch.dict(
            os.environ,
            {
                "VREPLY_LLM_API_KEY": "test-key",
                "VREPLY_LLM_BASE_URL": "https://example.test/v1",
                "VREPLY_LLM_MODEL": "test-model",
            },
        )

    def test_missing_key_is_reported_without_breaking_capabilities(self) -> None:
        with patch.dict(
            os.environ,
            {"VREPLY_LLM_API_KEY": "", "OPENAI_API_KEY": ""},
        ):
            self.assertFalse(server.language_capabilities()["aiLanguage"]["available"])
            with self.assertRaises(server.APIError) as raised:
                server.translate_segments(
                    {
                        "transcriptId": self.transcript["transcriptId"],
                        "segmentIds": [2],
                        "targetLanguage": "zh-CN",
                    }
                )
        self.assertEqual(raised.exception.code, "ai_not_configured")

    def test_translation_uses_adjacent_context_and_caches_each_line(self) -> None:
        calls = []

        def fake_call(**kwargs):
            calls.append(kwargs)
            return {
                "translations": [
                    {"segmentId": line["segmentId"], "text": "这个项目现在可以起飞了。", "note": ""}
                    for line in kwargs["input_data"]["lines"]
                ]
            }

        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentIds": [2],
            "targetLanguage": "zh-CN",
        }
        with self._env(), patch.object(server, "_call_llm_structured", side_effect=fake_call):
            first = server.translate_segments(payload)
            second = server.translate_segments(payload)

        self.assertEqual(len(calls), 1)
        context = calls[0]["input_data"]["lines"][0]
        self.assertEqual(context["previous"], "We turned the system on.")
        self.assertEqual(context["next"], "That result surprised everyone.")
        self.assertFalse(first["translations"][0]["cached"])
        self.assertTrue(second["translations"][0]["cached"])

    def test_spanish_translation_uses_the_transcript_language(self) -> None:
        def fake_call(**kwargs):
            return {
                "translations": [
                    {"segmentId": 2, "text": "这个项目现在可以起飞了。", "note": ""}
                ]
            }

        payload = {
            "transcriptId": self.spanish_transcript["transcriptId"],
            "segmentIds": [2],
            "targetLanguage": "zh-CN",
        }
        with self._env(), patch.object(server, "_call_llm_structured", side_effect=fake_call) as ai_call:
            server.translate_segments(payload)

        request = ai_call.call_args.kwargs
        self.assertEqual(request["input_data"]["sourceLanguage"], "es")
        self.assertIn("Spanish-to-Simplified-Chinese", request["instructions"])

    def test_summary_uses_translation_api_config_and_is_cached(self) -> None:
        calls = []

        def fake_call(**kwargs):
            calls.append(kwargs)
            return {
                "title": "项目启动后的结果",
                "overview": "视频介绍了系统启动、项目推进以及结果出乎所有人预料的完整过程。",
                "topics": ["系统启动", "项目推进", "意外结果"],
                "points": [
                    {"segmentId": 1, "heading": "启动系统", "text": "团队首先打开系统，为后续工作做好准备。"},
                    {"segmentId": 2, "heading": "推进项目", "text": "系统运行后，项目得以正式进入快速推进阶段。"},
                    {"segmentId": 3, "heading": "结果出现", "text": "最终结果超出所有人的预期，成为视频的结论。"},
                ],
            }

        payload = {"transcriptId": self.transcript["transcriptId"], "targetLanguage": "zh-CN"}
        with self._env(), patch.object(server, "_call_llm_structured", side_effect=fake_call):
            first = server.summarize_transcript(payload)
            second = server.summarize_transcript(payload)

        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["schema_name"], "vreply_video_summary")
        self.assertEqual(calls[0]["model"], "test-model")
        self.assertEqual(calls[0]["input_data"]["lines"][1]["segmentId"], 2)
        self.assertFalse(first["cached"])
        self.assertTrue(second["cached"])
        self.assertEqual(second["summary"]["points"][1]["heading"], "推进项目")

    def test_summary_rejects_unknown_segment_references(self) -> None:
        generated = {
            "title": "无效总结",
            "overview": "模型返回了一个不属于当前字幕的时间位置。",
            "topics": ["测试"],
            "points": [{"segmentId": 999, "heading": "错误位置", "text": "这个位置不存在。"}],
        }
        payload = {"transcriptId": self.transcript["transcriptId"], "targetLanguage": "zh-CN"}
        with self._env(), patch.object(server, "_call_llm_structured", return_value=generated):
            with self.assertRaises(server.APIError) as raised:
                server.summarize_transcript(payload)
        self.assertEqual(raised.exception.code, "ai_invalid_response")

    def test_sentence_analysis_uses_context_and_cache(self) -> None:
        generated = {
            "grammar": [{"point": "一般过去时", "explanation": "turned 表示已经发生的动作。"}],
            "sentencePattern": {"name": "主语 + 谓语 + 宾语", "explanation": "核心成分完整。"},
            "phrases": [{"phrase": "turn on", "meaning": "打开设备。"}],
            "readingTips": [{"focus": "连读", "tip": "turned on 可自然连读。"}],
        }
        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentId": 1,
            "targetLanguage": "zh-CN",
        }
        with self._env(), patch.object(server, "_call_llm_structured", return_value=generated) as ai_call:
            first = server.analyze_sentence(payload)
            second = server.analyze_sentence(payload)

        self.assertEqual(ai_call.call_count, 1)
        self.assertEqual(ai_call.call_args.kwargs["input_data"]["context"]["next"], "The project can take off now.")
        self.assertFalse(first["cached"])
        self.assertTrue(second["cached"])
        self.assertEqual(second["analysis"]["phrases"][0]["phrase"], "turn on")

    def test_dictionary_checks_selection_and_caches_contextual_entry(self) -> None:
        calls = []

        def fake_call(**kwargs):
            calls.append(kwargs)
            return {
                "headword": "take off",
                "pronunciationUS": "/teɪk ɔːf/",
                "pronunciationUK": "/teɪk ɒf/",
                "partOfSpeech": "短语动词",
                "meaning": "起飞；迅速开始成功",
                "englishMeaning": "To become successful or popular very quickly.",
                "contextMeaning": "本句表示项目开始快速推进。",
                "example": "The new product really took off.",
                "exampleTranslation": "这款新产品迅速走红了。",
                "senses": [{
                    "partOfSpeech": "短语动词 phrasal verb",
                    "meaning": "起飞；迅速开始成功",
                    "englishDefinition": "To become successful or popular very quickly.",
                    "example": "The new product really took off.",
                    "exampleTranslation": "这款新产品迅速走红了。",
                }],
                "wordForms": [{"label": "过去式", "word": "took off"}],
                "etymology": "由 take 与 off 构成。",
                "phrases": [{"phrase": "take off from", "meaning": "从……起飞"}],
                "synonyms": ["succeed", "soar"],
                "wordFamily": [],
            }

        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentId": 2,
            "selection": "take off",
            "targetLanguage": "zh-CN",
        }
        with self._env(), patch.object(server, "_local_dictionary_lookup", return_value=None), patch.object(
            server, "_call_llm_structured", side_effect=fake_call
        ):
            first = server.define_selection(payload)
            second = server.define_selection(payload)

        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["input_data"]["context"]["previous"], "We turned the system on.")
        self.assertFalse(first["entry"]["cached"])
        self.assertTrue(second["entry"]["cached"])
        self.assertEqual(first["entry"]["senses"][0]["partOfSpeech"], "短语动词 phrasal verb")
        self.assertEqual(first["entry"]["wordForms"][0]["word"], "took off")
        self.assertIn("soar", first["entry"]["synonyms"])

    def test_spanish_dictionary_skips_english_local_data_and_uses_ai(self) -> None:
        generated = {
            "headword": "despegar",
            "pronunciationUS": "/despeˈɣaɾ/",
            "pronunciationUK": "/despeˈɣaɾ/",
            "partOfSpeech": "动词 verbo",
            "meaning": "起飞；迅速发展",
            "englishMeaning": "Separarse del suelo e iniciar el vuelo.",
            "contextMeaning": "本句比喻项目即将迅速发展。",
            "example": "El avión va a despegar.",
            "exampleTranslation": "飞机要起飞了。",
            "senses": [{
                "partOfSpeech": "动词 verbo",
                "meaning": "起飞",
                "englishDefinition": "Separarse del suelo e iniciar el vuelo.",
                "example": "El avión va a despegar.",
                "exampleTranslation": "飞机要起飞了。",
            }],
            "wordForms": [{"label": "过去时", "word": "despegó"}],
            "etymology": "由 des- 与 pegar 构成。",
            "phrases": [],
            "synonyms": ["elevarse"],
            "wordFamily": [],
        }
        payload = {
            "transcriptId": self.spanish_transcript["transcriptId"],
            "segmentId": 2,
            "selection": "despegar",
            "targetLanguage": "zh-CN",
        }
        with self._env(), patch.object(server, "_local_dictionary_lookup") as local_lookup, patch.object(
            server,
            "_call_llm_structured",
            return_value=generated,
        ) as ai_call:
            result = server.define_selection(payload)

        local_lookup.assert_not_called()
        self.assertEqual(ai_call.call_args.kwargs["input_data"]["sourceLanguage"], "es")
        self.assertIn("learners of Spanish", ai_call.call_args.kwargs["instructions"])
        self.assertEqual(result["entry"]["sourceLanguage"], "es")

    def test_local_dictionary_works_without_an_api_key(self) -> None:
        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentId": 2,
            "selection": "take off",
            "targetLanguage": "zh-CN",
        }
        with patch.dict(
            os.environ,
            {"VREPLY_LLM_API_KEY": "", "DEEPSEEK_API_KEY": "", "OPENAI_API_KEY": ""},
        ), patch.object(server, "_call_llm_structured") as ai_call:
            result = server.define_selection(payload)

        self.assertEqual(result["entry"]["source"], "local")
        self.assertEqual(result["entry"]["dictionary"], "ECDICT")
        self.assertIn("起飞", result["entry"]["meaning"])
        self.assertIn("englishMeaning", result["entry"])
        self.assertEqual(result["entry"]["contextMeaning"], "")
        ai_call.assert_not_called()

    def test_local_only_dictionary_returns_before_ai_enrichment(self) -> None:
        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentId": 2,
            "selection": "take off",
            "targetLanguage": "zh-CN",
            "localOnly": True,
        }
        local_entry = {
            "selection": "take off",
            "headword": "take off",
            "source": "local",
            "senses": [{"partOfSpeech": "短语动词", "meaning": "起飞"}],
        }

        with patch.object(server, "_local_dictionary_lookup", return_value=local_entry), patch.object(
            server, "_llm_config"
        ) as llm_config, patch.object(server, "_call_llm_structured") as ai_call:
            result = server.define_selection(payload)

        self.assertEqual(result["entry"], local_entry)
        llm_config.assert_not_called()
        ai_call.assert_not_called()

    def test_local_dictionary_resolves_inflected_word_aliases(self) -> None:
        entry = server._local_dictionary_lookup("agents")

        self.assertIsNotNone(entry)
        self.assertEqual(entry["headword"], "agent")

    def test_local_dictionary_groups_parts_of_speech_and_word_forms(self) -> None:
        entry = server._local_dictionary_lookup("run")

        self.assertIsNotNone(entry)
        self.assertGreaterEqual(len(entry["senses"]), 3)
        self.assertTrue(any("名词 noun" == sense["partOfSpeech"] for sense in entry["senses"]))
        self.assertTrue(any(form["word"] == "ran" for form in entry["wordForms"]))
        self.assertTrue(any(form["word"] == "running" for form in entry["wordForms"]))

    def test_missing_local_entry_explains_optional_ai_fallback(self) -> None:
        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentId": 2,
            "selection": "project can",
            "targetLanguage": "zh-CN",
        }
        with patch.dict(
            os.environ,
            {"VREPLY_LLM_API_KEY": "", "DEEPSEEK_API_KEY": "", "OPENAI_API_KEY": ""},
        ), patch.object(server, "_local_dictionary_lookup", return_value=None), self.assertRaises(
            server.APIError
        ) as raised:
            server.define_selection(payload)

        self.assertEqual(raised.exception.code, "dictionary_entry_not_found")

    def test_dictionary_rejects_text_outside_the_selected_line(self) -> None:
        with self._env(), self.assertRaises(server.APIError) as raised:
            server.define_selection(
                {
                    "transcriptId": self.transcript["transcriptId"],
                    "segmentId": 2,
                    "selection": "surprised",
                    "targetLanguage": "zh-CN",
                }
            )
        self.assertEqual(raised.exception.code, "selection_not_in_segment")

    def test_dictionary_rejects_a_substring_that_is_not_a_whole_word(self) -> None:
        with self._env(), self.assertRaises(server.APIError) as raised:
            server.define_selection(
                {
                    "transcriptId": self.transcript["transcriptId"],
                    "segmentId": 2,
                    "selection": "he",
                    "targetLanguage": "zh-CN",
                }
            )
        self.assertEqual(raised.exception.code, "selection_not_in_segment")

    def test_translation_rejects_missing_model_results(self) -> None:
        with self._env(), patch.object(
            server,
            "_call_llm_structured",
            return_value={"translations": []},
        ), self.assertRaises(server.APIError) as raised:
            server.translate_segments(
                {
                    "transcriptId": self.transcript["transcriptId"],
                    "segmentIds": [1, 2],
                    "targetLanguage": "zh-CN",
                }
            )
        self.assertEqual(raised.exception.code, "ai_invalid_response")

    def test_translation_rejects_boolean_model_segment_id(self) -> None:
        with self._env(), patch.object(
            server,
            "_call_llm_structured",
            return_value={"translations": [{"segmentId": True, "text": "译文", "note": ""}]},
        ), self.assertRaises(server.APIError) as raised:
            server.translate_segments(
                {
                    "transcriptId": self.transcript["transcriptId"],
                    "segmentIds": [1],
                    "targetLanguage": "zh-CN",
                }
            )
        self.assertEqual(raised.exception.code, "ai_invalid_response")

    def test_context_rejects_an_oversized_target_line(self) -> None:
        transcript = {"segments": [{"id": 1, "text": "x" * (server.MAX_TARGET_CONTEXT_CHARS + 1)}]}
        with self.assertRaises(server.APIError) as raised:
            server._segment_context(transcript, 1)
        self.assertEqual(raised.exception.code, "context_too_large")

    def test_chat_parser_maps_malformed_answers_to_api_errors(self) -> None:
        cases = [{"choices": None}, {"choices": []}, {"choices": [{"message": {"content": None}}]}]
        for response in cases:
            with self.subTest(response=response), patch.object(
                server, "_post_llm_chat", return_value=response
            ), self.assertRaises(server.APIError) as raised:
                server._call_llm_structured(
                    base_url="https://example.test/v1",
                    api_key="test-key",
                    model="test-model",
                    schema_name="test",
                    schema={"type": "object"},
                    instructions="Return JSON.",
                    input_data={},
                    max_output_tokens=100,
                )
            self.assertEqual(raised.exception.status, 502)

    def test_structured_call_retries_truncated_json_once(self) -> None:
        responses = [
            {
                "choices": [
                    {"finish_reason": "length", "message": {"content": '{"translations": ['}}
                ]
            },
            {
                "choices": [
                    {"finish_reason": "stop", "message": {"content": '{"translations": []}'}}
                ]
            },
        ]
        with patch.object(server, "_post_llm_chat", side_effect=responses) as post:
            result = server._call_llm_structured(
                base_url="https://example.test/v1",
                api_key="test-key",
                model="test-model",
                schema_name="test",
                schema={"type": "object"},
                instructions="Return JSON.",
                input_data={},
                max_output_tokens=100,
            )

        self.assertEqual(result, {"translations": []})
        self.assertEqual(post.call_count, 2)
        self.assertEqual(post.call_args.kwargs["max_output_tokens"], 1000)

    def test_deepseek_request_disables_thinking_and_enables_json_mode(self) -> None:
        captured = {}

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return None

            def read(self, _limit):
                return b'{"choices":[]}'

        class FakeOpener:
            def open(self, request, timeout):
                captured["payload"] = json.loads(request.data.decode("utf-8"))
                captured["timeout"] = timeout
                return FakeResponse()

        with patch.object(server, "build_opener", return_value=FakeOpener()):
            server._post_llm_chat(
                "https://api.deepseek.com",
                "test-key",
                "deepseek-v4-flash",
                [{"role": "user", "content": "Translate."}],
                max_output_tokens=500,
            )

        self.assertEqual(captured["payload"]["thinking"], {"type": "disabled"})
        self.assertEqual(captured["payload"]["response_format"], {"type": "json_object"})

    def test_browser_configuration_is_used_and_key_is_never_exposed(self) -> None:
        result = server.configure_llm(
            {
                "baseUrl": "https://api.example.com/v1/",
                "apiKey": "secret-key",
                "model": "example/model-1",
            }
        )

        self.assertTrue(result["aiLanguage"]["available"])
        self.assertNotIn("apiKey", result["aiLanguage"]["config"])
        self.assertTrue(result["aiLanguage"]["config"]["hasApiKey"])
        self.assertEqual(server._llm_config()["baseUrl"], "https://api.example.com/v1")
        self.assertEqual(server._llm_endpoint(server._llm_config()["baseUrl"]), "https://api.example.com/v1/chat/completions")

    def test_configuration_rejects_credentials_in_base_url(self) -> None:
        with self.assertRaises(server.APIError) as raised:
            server.configure_llm(
                {"baseUrl": "https://user:pass@example.com/v1", "apiKey": "key", "model": "model"}
            )
        self.assertEqual(raised.exception.code, "invalid_llm_base_url")


if __name__ == "__main__":
    unittest.main()
