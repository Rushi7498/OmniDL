"""Preserve Instagram images before yt-dlp's video-only result processing.

Network extraction stays in yt-dlp's maintained Instagram extractor. Only its
media mapping is extended; no cookies, login, or alternate access is added.
"""
import json
import sys
from urllib.parse import urlparse

from yt_dlp import YoutubeDL
from yt_dlp.extractor.instagram import InstagramIE


class OmniInstagramIE(InstagramIE):
    def _extract_product_media(self, media):
        result = super()._extract_product_media(media)
        if media.get("media_type") == 1:
            candidates = media.get("image_versions2", {}).get("candidates", [])
            candidates = [c for c in candidates if c.get("url")]
            if not candidates:
                raise ValueError("Instagram returned an image without a source URL")
            best = max(candidates, key=lambda c: (c.get("width") or 0) * (c.get("height") or 0))
            extension = urlparse(best["url"]).path.rsplit(".", 1)[-1].lower()
            if extension not in {"jpg", "jpeg", "png", "webp", "avif"}:
                extension = "jpg"
            result.update(url=best["url"], ext=extension, thumbnail=best["url"])
            # The parent checks for a format even when extracting without download.
            result["formats"] = [{"url": best["url"], "ext": extension}]
        else:
            for fmt in result.get("formats", []):
                fmt.setdefault("ext", "mp4")
                fmt["vcodec"] = fmt.get("vcodec") or "unknown"
                fmt["acodec"] = fmt.get("acodec") or "unknown"
        return result


def main():
    with YoutubeDL({"proxy": sys.argv[1], "quiet": True, "no_warnings": True,
                    "socket_timeout": 20, "retries": 1, "cachedir": False}) as ydl:
        result = OmniInstagramIE(ydl).extract(sys.argv[2])
        print(json.dumps(result))


if __name__ == "__main__":
    main()
