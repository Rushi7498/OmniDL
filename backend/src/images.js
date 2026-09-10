import { stat } from "node:fs/promises";
import { config, AppError } from "./config.js";
import { run } from "./process.js";

export async function convertImage(input, output, extension, signal) {
  const encoders = {
    png: ["-c:v", "png"],
    jpg: ["-c:v", "mjpeg", "-q:v", "2"],
    jpeg: ["-c:v", "mjpeg", "-q:v", "2"],
    webp: ["-c:v", "libwebp", "-lossless", "1"],
  };
  if (!encoders[extension]) throw new AppError("Unsupported image format.");
  await run(
    config.ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-nostdin",
      "-y",
      "-protocol_whitelist",
      "file,pipe",
      "-i",
      input,
      "-map",
      "0:v:0",
      "-frames:v",
      "1",
      ...encoders[extension],
      "-fs",
      String(config.maxBytes + 1),
      output,
    ],
    { signal },
  );
  if ((await stat(output)).size > config.maxBytes)
    throw new AppError("Converted image exceeds the size limit.", 413);
  return output;
}
