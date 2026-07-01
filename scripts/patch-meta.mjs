// Post-build patch for .edgeone/meta.json.
//
// The @edgeone/react-router adapter generates meta.json with
// `conf.ssr404 = true`, which makes the SSR server handler catch ALL
// unmatched paths (including /api/*) and return a React Router 404 —
// BEFORE the edge functions in edge-functions/api/ get a chance to run.
//
// Setting ssr404=false restores edge-function priority for non-framework
// paths. The app route "/" stays in frameworkRoutes, so the main app is
// unaffected; only genuinely unknown paths lose the SSR 404 page (they
// get EdgeOne's default 404 instead), which is an acceptable trade-off.
import fs from "node:fs";

const META_PATH = ".edgeone/meta.json";

try {
  const meta = JSON.parse(fs.readFileSync(META_PATH, "utf8"));
  if (meta && meta.conf) {
    meta.conf.ssr404 = false;
  }
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + "\n");
  console.log("[patch-meta] set conf.ssr404=false in .edgeone/meta.json");
} catch (err) {
  console.warn("[patch-meta] could not patch .edgeone/meta.json:", err.message);
}
