// Empty origin preserves Vite proxy and single-server local deployments.
const origin = (import.meta.env.VITE_API_ORIGIN || "").replace(/\/+$/, "");
export const apiUrl = (path) => origin + path;
