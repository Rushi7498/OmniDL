"""Keep anonymous extractor-session cookies with each exact media source."""
import json
import sys
from urllib.request import Request
from yt_dlp import YoutubeDL


def main():
    with YoutubeDL({"proxy": sys.argv[1], "quiet": True, "no_warnings": True,
                    "socket_timeout": 20, "retries": 1, "cachedir": False,
                    "noplaylist": True}) as ydl:
        result = ydl.extract_info(sys.argv[2], download=False)
        for entry in result.get("entries") or [result]:
            for fmt in entry.get("formats", []):
                request = Request(fmt["url"])
                ydl.cookiejar.add_cookie_header(request)
                fmt["omnidl_cookie"] = request.get_header("Cookie", "")
        print(json.dumps(ydl.sanitize_info(result)))


if __name__ == "__main__":
    main()
