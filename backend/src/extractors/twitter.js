import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { run } from "../process.js";
import { galleryMetadata } from "./common.js";
const python =
  process.env.PYTHON_PATH ||
  (isAbsolute(config.yt) ? join(dirname(config.yt), "python") : "python3");
const adapter = fileURLToPath(
  new URL("../../python/twitter.py", import.meta.url),
);
export async function extract(url, proxy, signal) {
  try {
    return JSON.parse(await run(python, [adapter, proxy, url], { signal }));
  } catch (error) {
    if (signal.aborted) throw error;
    try {
      return await galleryMetadata(url, proxy, signal);
    } catch {
      throw error;
    }
  }
}
