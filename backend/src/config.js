const number = (key, fallback) => {
  const n = Number(process.env[key] || fallback);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid ${key}`);
  return n;
};
export const config = {
  port: number("PORT", 3001),
  host: process.env.HOST || "127.0.0.1",
  maxBytes: number("MAX_MEDIA_MB", 200) * 1024 * 1024,
  timeout: number("REQUEST_TIMEOUT_MS", 120000),
  ttl: number("SESSION_TTL_MS", 900000),
  jobs: number("MAX_CONCURRENT_JOBS", 3),
  yt: process.env.YTDLP_PATH || "yt-dlp",
  gallery: process.env.GALLERYDL_PATH || "gallery-dl",
  ffmpeg: process.env.FFMPEG_PATH || "ffmpeg",
};
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
