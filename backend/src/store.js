import { config, AppError } from "./config.js";
const sessions = new Map();
export function save(media) {
  for (const [id, m] of sessions)
    if (m.expiresAt < Date.now()) sessions.delete(id);
  if (sessions.size >= 100) sessions.delete(sessions.keys().next().value);
  media.expiresAt = Date.now() + config.ttl;
  sessions.set(media.id, media);
  return media;
}
export function get(id) {
  const media = sessions.get(id);
  if (!media || media.expiresAt < Date.now()) {
    sessions.delete(id);
    throw new AppError("This preview expired. Analyze the link again.", 410);
  }
  return media;
}
