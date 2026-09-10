import { postMetadata } from "./post-metadata.js";
import { randomUUID } from "node:crypto";
import { AppError } from "./config.js";
const direct = (f) =>
  f.url &&
  /^https?:/.test(f.url) &&
  (!f.protocol || ["https", "http"].includes(f.protocol)) &&
  !/m3u8|\.mpd(?:\?|$)/i.test(f.url) &&
  !f.has_drm;
export function normalize(raw, platform, url) {
  const entries = raw.entries || [raw];
  if (entries.length > 30)
    throw new AppError("This post exceeds the 30-item limit.", 413);
  if (entries.some((entry) => !entry))
    throw new AppError("Some media items in this post are unavailable.", 422);
  const items = entries.map((e) => {
    const image = ["jpg", "jpeg", "png", "webp", "avif"].includes(
      e.ext?.toLowerCase(),
    );
    const sourceOption = (format) => ({
      url: format.url,
      anonymousCookie: format.omnidl_cookie || "",
      headers: {
        ...raw.http_headers,
        ...e.http_headers,
        ...format.http_headers,
      },
    });
    const item = {
      id: randomUUID(),
      type: image ? "image" : "video",
      thumbnail:
        e.thumbnail || e.thumbnails?.at(-1)?.url || (image ? e.url : undefined),
      duration: e.duration || null,
      formats: [],
    };
    if (image) {
      for (const extension of ["png", "jpg", "jpeg", "webp"])
        item.formats.push({
          id: randomUUID(),
          kind: "image",
          extension,
          label: extension.toUpperCase(),
          sources: [e.url],
        });
    } else {
      const fs = (
        e.formats?.length
          ? e.formats
          : [{ ...e, vcodec: "unknown", acodec: "unknown" }]
      )
        .filter(direct)
        .map((format) => ({
          ...format,
          vcodec:
            format.vcodec ?? (format.ext === "mp4" ? "unknown" : undefined),
          acodec:
            format.acodec ?? (format.ext === "mp4" ? "unknown" : undefined),
        }));
      const audio = fs
        .filter((f) => f.acodec && f.acodec !== "none")
        .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0));
      const seen = new Set();
      for (const f of fs
        .filter((f) => f.vcodec && f.vcodec !== "none" && f.ext === "mp4")
        .sort(
          (a, b) =>
            (b.height || 0) - (a.height || 0) || (b.tbr || 0) - (a.tbr || 0),
        )) {
        const h = f.height || 0;
        if (seen.has(h)) continue;
        const a =
          f.acodec === "none"
            ? audio.find((a) => a.vcodec === "none" && a.ext === "m4a")
            : null;
        if (f.acodec === "none" && !a && !e.silent_video) continue;
        seen.add(h);
        item.formats.push({
          id: randomUUID(),
          kind: "video",
          extension: "mp4",
          label: h ? `${h}p` : "Best available",
          sources: [f.url, ...(a ? [a.url] : [])],
          sourceOptions: [
            [
              f,
              ...fs.filter(
                (candidate) =>
                  candidate !== f &&
                  candidate.ext === "mp4" &&
                  candidate.height === f.height &&
                  candidate.vcodec === f.vcodec &&
                  (candidate.acodec === "none") === (f.acodec === "none"),
              ),
            ].map(sourceOption),
            ...(a ? [[sourceOption(a)]] : []),
          ],
        });
      }
      if (audio.length)
        for (const extension of ["mp3", "m4a"])
          item.formats.push({
            id: randomUUID(),
            kind: "audio",
            extension,
            label: extension.toUpperCase(),
            sources: [audio[0].url],
            sourceOptions: [[sourceOption(audio[0])]],
          });
    }
    return item;
  });
  if (!items.length || items.some((i) => !i.formats.length))
    throw new AppError(
      "No supported direct media source was available for every item in this post.",
      422,
    );
  return {
    id: randomUUID(),
    ...postMetadata(raw),
    platform,
    sourceUrl: url,
    title: raw.title || raw.description || "Untitled post",
    creator: raw.uploader || raw.creator || raw.channel || null,
    type:
      items.length === 1
        ? items[0].type
        : items.every((i) => i.type === "image")
          ? "slideshow"
          : "mixed",
    items,
  };
}
export function publicMedia(media) {
  return {
    ...media,
    items: media.items.map(({ thumbnail, ...item }) => ({
      ...item,
      previewUrl: thumbnail
        ? `/api/v1/media/${media.id}/preview/${item.id}`
        : null,
      formats: item.formats.map(
        ({ sources, sourceOptions, ...format }) => format,
      ),
    })),
  };
}
