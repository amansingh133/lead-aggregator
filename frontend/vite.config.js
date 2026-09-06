import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";

// ── Local HTTPS for the dev server — TEMPORARY ──────────────────────────
// Only needed while testing Facebook Login locally: Facebook Login for
// Business rejects `http://localhost` redirect URIs, so the OAuth callback
// has to be served over https://localhost:5173 during local testing.
//
// Enable:  set VITE_DEV_HTTPS=true in frontend/.env, then generate certs once:
//            cd frontend && mkdir certs && cd certs && mkcert localhost 127.0.0.1 ::1
// Revert:  remove VITE_DEV_HTTPS from frontend/.env (or delete frontend/certs/).
//          No code change needed — once the app is served from a real HTTPS
//          domain this block just no-ops and the dev server is plain HTTP again.
const DEV_HTTPS_KEY = "./certs/localhost+2-key.pem";
const DEV_HTTPS_CERT = "./certs/localhost+2.pem";

function devHttps(env) {
  if (env.VITE_DEV_HTTPS !== "true") return undefined;
  if (!fs.existsSync(DEV_HTTPS_KEY) || !fs.existsSync(DEV_HTTPS_CERT)) {
    console.warn(
      `[vite] VITE_DEV_HTTPS=true but no certs at ${DEV_HTTPS_CERT}. ` +
        "Run: cd frontend && mkdir certs && cd certs && mkcert localhost 127.0.0.1 ::1 — serving HTTP for now.",
    );
    return undefined;
  }
  return {
    key: fs.readFileSync(DEV_HTTPS_KEY),
    cert: fs.readFileSync(DEV_HTTPS_CERT),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      https: devHttps(env),
      proxy: {
        "/api": {
          target: env.VITE_DEV_PROXY_TARGET || "http://localhost:6000",
          changeOrigin: true,
        },
      },
    },
  };
});
