import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("ssr", "routes/ssr.tsx"),
  route("csr", "routes/csr.tsx"),
  route("streaming", "routes/streaming.tsx"),
  route("prerender", "routes/prerender.tsx"),
  route("pages-functions", "routes/pages-functions.tsx"),
] satisfies RouteConfig;
