import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { edgeoneAdapter } from "@edgeone/react-router";
import fs from "node:fs";

/**
 * Patches `.edgeone/meta.json` after the EdgeOne adapter generates it.
 *
 * The adapter writes `conf.ssr404 = true`, which makes the SSR server
 * handler catch every unmatched path (including `/api/*`) and return a
 * React Router 404 — BEFORE the edge functions in `edge-functions/api/`
 * can run. Flipping `ssr404` to `false` restores edge-function routing
 * for non-framework paths. The app route "/" stays in `frameworkRoutes`,
 * so the main app is unaffected.
 *
 * `closeBundle` runs after the adapter's `writeBundle`, so meta.json
 * already exists by the time this runs.
 */
function patchEdgeOneMeta() {
  return {
    name: "patch-edgeone-meta",
    apply: "build" as const,
    enforce: "post" as const,
    closeBundle() {
      try {
        const p = ".edgeone/meta.json";
        if (!fs.existsSync(p)) return;
        const meta = JSON.parse(fs.readFileSync(p, "utf8"));
        if (meta?.conf) meta.conf.ssr404 = false;
        fs.writeFileSync(p, JSON.stringify(meta, null, 2) + "\n");
        console.log("[patch-edgeone-meta] set conf.ssr404=false");
      } catch (e) {
        console.warn("[patch-edgeone-meta] skipped:", (e as Error).message);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    edgeoneAdapter(),
    patchEdgeOneMeta(),
  ],
});
