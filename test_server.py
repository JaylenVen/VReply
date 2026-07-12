import os
import json
import unittest
from unittest.mock import patch

import server


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

        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["end"], result[1]["start"])
        self.assertEqual([word["text"] for word in result[0]["words"]], ["Uh", "hello", "everyone.", "Jack"])
        self.assertEqual(result[0]["words"][0]["start"], 4.08)
        self.assertEqual(result[0]["words"][1]["start"], 4.28)
        self.assertEqual(result[0]["words"][-1]["end"], 5.84)

    def test_words_without_offsets_are_evenly_inferred(self) -> None:
        payload = {
            "events": [
                {
                    "tStartMs": 1000,
                    "dDurationMs": 3000,
                    "segs": [{"utf8": "One two three"}],
                }
            ]
        }

        result = server.normalize_json3_segments(payload)

        self.assertEqual(
            [(word["start"], word["end"]) for word in result[0]["words"]],
            [(1.0, 2.0), (2.0, 3.0), (3.0, 4.0)],
        )


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

    def test_dictionary_checks_selection_and_caches_contextual_entry(self) -> None:
        calls = []

        def fake_call(**kwargs):
            calls.append(kwargs)
            return {
                "headword": "take off",
                "pronunciation": "/teɪk ɒf/",
                "partOfSpeech": "短语动词",
                "meaning": "起飞；迅速开始成功",
                "contextMeaning": "本句表示项目开始快速推进。",
                "example": "The new product really took off.",
                "exampleTranslation": "这款新产品迅速走红了。",
            }

        payload = {
            "transcriptId": self.transcript["transcriptId"],
            "segmentId": 2,
            "selection": "take off",
            "targetLanguage": "zh-CN",
        }
        with self._env(), patch.object(server, "_call_llm_structured", side_effect=fake_call):
            first = server.define_selection(payload)
            second = server.define_selection(payload)

        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["input_data"]["context"]["previous"], "We turned the system on.")
        self.assertFalse(first["entry"]["cached"])
        self.assertTrue(second["entry"]["cached"])

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
