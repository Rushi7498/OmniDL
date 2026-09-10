import unittest
from instagram import OmniInstagramIE
from yt_dlp import YoutubeDL


class InstagramMediaTests(unittest.TestCase):
    def setUp(self):
        self.extractor = OmniInstagramIE(YoutubeDL({"quiet": True, "cachedir": False}))

    def test_image_uses_largest_candidate(self):
        result = self.extractor._extract_product_media({
            "pk": "123", "media_type": 1,
            "image_versions2": {"candidates": [
                {"url": "https://example.com/small.jpg", "width": 100, "height": 100},
                {"url": "https://example.com/original.jpg", "width": 1080, "height": 1350},
            ]},
        })
        self.assertEqual(result["ext"], "jpg")
        self.assertEqual(result["url"], "https://example.com/original.jpg")

    def test_video_retains_audio_availability(self):
        result = self.extractor._extract_product_media({
            "pk": "124", "media_type": 2, "has_audio": False,
            "video_versions": [{"url": "https://example.com/video.mp4", "width": 720}],
        })
        self.assertEqual(result["formats"][0]["ext"], "mp4")
        self.assertEqual(result["formats"][0]["acodec"], "none")

    def test_missing_image_is_not_silently_dropped(self):
        with self.assertRaises(ValueError):
            self.extractor._extract_product_media({"pk": "125", "media_type": 1})


if __name__ == "__main__":
    unittest.main()
