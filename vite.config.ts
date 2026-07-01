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
      // The EdgeOne adapter writes meta.json to TWO locations:
      //   .edgeone/meta.json            (root)
      //   .edgeone/server-handler/meta.json  (next to the SSR handler)
      // The runtime reads the server-handler copy, so BOTH must be patched.
      const targets = [
        ".edgeone/meta.json",
        ".edgeone/server-handler/meta.json",
      ];
      let patched = 0;
      for (const p of targets) {
        try {
          if (!fs.existsSync(p)) continue;
          const meta = JSON.parse(fs.readFileSync(p, "utf8"));
          if (meta?.conf) {
            meta.conf.ssr404 = false;
            fs.writeFileSync(p, JSON.stringify(meta, null, 2) + "\n");
            patched++;
          }
        } catch (e) {
          console.warn(`[patch-edgeone-meta] skipped ${p}:`, (e as Error).message);
        }
      }
      if (patched > 0) {
        console.log(`[patch-edgeone-meta] set conf.ssr404=false in ${patched} file(s)`);
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
