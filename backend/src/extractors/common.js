import { run } from "../process.js";
import { config, AppError } from "../config.js";
export async function videoMetadata(url, proxy, signal) {
  return JSON.parse(
    await run(
      config.yt,
      [
        "--ignore-config",
        "--proxy",
        proxy,
        "--no-playlist",
        "--js-runtimes",
        `node:${process.execPath}`,
        "--skip-download",
        "--dump-single-json",
        "--socket-timeout",
        "20",
        "--retries",
        "1",
        "--",
        url,
      ],
      { signal },
    ),
  );
}
export async function galleryMetadata(url, proxy, signal) {
  const rows = JSON.parse(
    await run(
      config.gallery,
      [
        "--config-ignore",
        "--proxy",
        proxy,
        "--dump-json",
        "--range",
        "1-31",
        "-o",
        "extractor.tiktok.audio=false",
        "-o",
        "extractor.retries=1",
        "-o",
        "extractor.timeout=20",
        url,
      ],
      { signal },
    ),
  );
  const failure = rows.find((row) => row[0] === -1);
  if (failure) {
    const message = failure[1]?.message || "";
    throw new AppError(
      /login|401|403|private/i.test(message)
        ? "The platform requires access for this post. Try another public link."
        : "The platform could not return all media items. Try again later.",
      422,
    );
  }
  const entries = rows
    .filter((r) => r[0] === 3)
    .map(([, url, m]) => {
      if (/\.m3u8(?:\?|$)/i.test(url)) {
        url =
          (m._fallback || []).find((candidate) =>
            /\.mp4(?:\?|$)/i.test(candidate),
          ) || url;
      }
      return {
        id: String(m.num || m.id || ""),
        title: m.title || m.description || m.content || m.caption || "",
        uploader:
          m.username ||
          (typeof m.user === "string" ? m.user : m.user?.username) ||
          m.author?.uniqueId ||
          m.author?.name ||
          m.pinner?.username ||
          m.author?.nick,
        thumbnail:
          m.thumbnail ||
          m.display_url ||
          m.video?.cover ||
          m.images?.orig?.url ||
          m.thumbnail_url ||
          (/\.(jpg|jpeg|png|webp)/i.test(url) ? url : undefined),
        url,
        ext: m.extension || new URL(url).pathname.split(".").pop(),
        duration: m.duration,
        height: m.height,
        http_headers: m.http_headers,
      };
    });
  if (
    entries.some(
      (e) => !/^https?:/.test(e.url) || /\.m3u8(?:\?|$)/i.test(e.url),
    )
  )
    throw new AppError("No direct media source found.", 422);
  if (!entries.length)
    throw new AppError("No downloadable media found in this post.", 422);
  return { entries, title: entries[0].title, uploader: entries[0].uploader };
}
export async function socialMetadata(url, proxy, signal) {
  try {
    return await galleryMetadata(url, proxy, signal);
  } catch (e) {
    if (signal.aborted) throw e;
    return videoMetadata(url, proxy, signal);
  }
}
