// Keep presentation metadata consistent across platform adapters.
export function postMetadata(raw) {
  const text = String(raw.description || raw.title || "Untitled post");
  const hashtags = [];
  const caption = text
    .replace(/(^|\s)#([\p{L}\p{N}_\p{M}]+)/gu, (_, space, tag) => {
      if (!hashtags.includes(tag)) hashtags.push(tag);
      return space;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
  const urlHandle = String(raw.uploader_url || raw.channel_url || "").match(
    /\/@([^/?#]+)/,
  )?.[1];
  const username = [
    raw.username,
    urlHandle,
    raw.uploader_id,
    raw.channel,
    raw.uploader,
  ].find(
    (value) =>
      typeof value === "string" &&
      /^@?[\p{L}\p{N}_.-]+$/u.test(value) &&
      !/^\d+$/.test(value),
  );
  return {
    caption,
    hashtags,
    username: username ? username.replace(/^@/, "") : null,
  };
}
