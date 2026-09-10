import { galleryMetadata, videoMetadata } from "./common.js";
export async function extract(url, proxy, signal) {
  const path = new URL(url).pathname;
  if (/\/photo(?:s|\.php|\/|$)/.test(path))
    return galleryMetadata(url, proxy, signal);
  return videoMetadata(url, proxy, signal);
}
