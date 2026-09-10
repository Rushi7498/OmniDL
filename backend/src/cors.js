export function apiCors(origins = []) {
  const allowed = new Set(origins);
  return (req, res, next) => {
    const origin = req.headers.origin;
    res.vary("Origin");
    if (origin && allowed.has(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Access-Control-Expose-Headers", "Content-Disposition");
    }
    if (req.method === "OPTIONS")
      return res.sendStatus(origin && allowed.has(origin) ? 204 : 403);
    next();
  };
}
