// Single source of truth for deployment-specific config. Vite only exposes
// vars prefixed VITE_ to client code (import.meta.env), see frontend/.env.example.
export const env = {
  // Empty (the frontend/.env default) => requests are relative, so the Vite
  // dev proxy handles /api (see vite.config.js). Set VITE_API_BASE_URL to the
  // backend's absolute origin for production builds, which have no proxy.
  // Must stay relative in local dev now that the dev server runs over HTTPS:
  // an absolute http://localhost:6000 would be blocked as mixed content.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  apiPrefix: import.meta.env.VITE_API_PREFIX || "/api/v1",
};
