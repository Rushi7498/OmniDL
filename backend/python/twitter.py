"""Normalize public X posts including images and mixed-media attachments."""
import json
import sys
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from yt_dlp import YoutubeDL
from yt_dlp.extractor.twitter import TwitterIE


def normalize_status(status):
    user = status.get("user") or {}
    entries = []
    for media in (status.get("extended_entities") or {}).get("media", []):
        thumbnail = media.get("media_url_https") or media.get("media_url")
        entry = {"id": str(media.get("id_str") or media.get("id") or len(entries)), "thumbnail": thumbnail}
        if media.get("type") == "photo":
            if not thumbnail:
                raise ValueError("An image has no public media source")
            parsed = urlparse(thumbnail)
            query = parse_qs(parsed.query)
            query["name"] = ["orig"]
            ext = query.get("format", [parsed.path.rsplit(".", 1)[-1]])[0]
            if ext not in {"jpg", "jpeg", "png", "webp", "avif"}:
                ext = "jpg"
            entry.update(ext=ext, url=urlunparse(parsed._replace(query=urlencode(query, doseq=True))))
        elif media.get("type") in {"video", "animated_gif"}:
            info = media.get("video_info") or {}
            formats = []
            for variant in info.get("variants", []):
                if variant.get("content_type") != "video/mp4":
                    continue
                fmt = {"url": variant["url"], "ext": "mp4", "vcodec": "h264",
                       "acodec": "none" if media["type"] == "animated_gif" else "unknown",
                       "tbr": (variant.get("bitrate") or 0) / 1000}
                TwitterIE._search_dimensions_in_video_url(fmt, variant["url"])
                formats.append(fmt)
            if not formats:
                raise ValueError("This post contains a video without a direct MP4 source")
            entry.update(formats=formats, duration=(info.get("duration_millis") or 0) / 1000)
            # Animated GIF attachments are silent MP4, not video-only adaptive tracks.
            entry["silent_video"] = media["type"] == "animated_gif"
        else:
            raise ValueError("Unsupported attachment in this post")
        entries.append(entry)
    if not entries:
        raise ValueError("No public image or video attachments found in this post")
    return {"title": status.get("full_text") or status.get("text") or "X post",
            "uploader": user.get("name"), "username": user.get("screen_name"), "entries": entries}


def main():
    with YoutubeDL({"proxy": sys.argv[1], "quiet": True, "no_warnings": True,
                    "socket_timeout": 20, "retries": 1, "cachedir": False}) as ydl:
        extractor = TwitterIE(ydl)
        extractor.initialize()
        post_id = extractor._match_valid_url(sys.argv[2]).group("id")
        status = extractor._extract_status(post_id)
        if not (status.get("extended_entities") or {}).get("media"):
            status = extractor._call_syndication_api(post_id)
        print(json.dumps(normalize_status(status)))


if __name__ == "__main__":
    main()
