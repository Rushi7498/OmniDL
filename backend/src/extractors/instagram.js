import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { run } from "../process.js";
import { galleryMetadata } from "./common.js";

// Use the same Python environment as yt-dlp when an absolute executable is set.
const python =
  process.env.PYTHON_PATH ||
  (isAbsolute(config.yt) ? join(dirname(config.yt), "python") : "python3");
const adapter = fileURLToPath(
  new URL("../../python/instagram.py", import.meta.url),
);

export async function extract(url, proxy, signal) {
  try {
    return JSON.parse(await run(python, [adapter, proxy, url], { signal }));
  } catch (primaryError) {
    if (signal.aborted) throw primaryError;
    try {
      return await galleryMetadata(url, proxy, signal);
    } catch {
      throw primaryError;
    }
  }
}
