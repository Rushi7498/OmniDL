import unittest
from twitter import normalize_status

class TwitterMediaTests(unittest.TestCase):
    def test_mixed_media_and_original_image(self):
        result = normalize_status({"text": "A post #test", "user": {"screen_name": "creator"}, "extended_entities": {"media": [
            {"type": "photo", "media_url_https": "https://pbs.twimg.com/media/example.jpg"},
            {"type": "video", "video_info": {"duration_millis": 2000, "variants": [{"content_type":"video/mp4", "url":"https://video.twimg.com/vid/720x1280/example.mp4", "bitrate":1000000}]}},
            {"type": "animated_gif", "video_info": {"variants": [{"content_type":"video/mp4", "url":"https://video.twimg.com/example.mp4"}]}},
        ]}})
        self.assertEqual(len(result["entries"]), 3)
        self.assertIn("name=orig", result["entries"][0]["url"])
        self.assertEqual(result["entries"][1]["duration"], 2)
        self.assertTrue(result["entries"][2]["silent_video"])
        self.assertEqual(result["entries"][2]["formats"][0]["acodec"], "none")

    def test_unavailable_attachment_rejects_whole_post(self):
        with self.assertRaises(ValueError):
            normalize_status({"extended_entities": {"media": [{"type":"video", "video_info": {"variants": []}}]}})

if __name__ == "__main__":
    unittest.main()
