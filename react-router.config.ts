import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  
  // Enable pre-rendering functionality
  prerender: [
    // Pre-render the Pre-render page
    "/prerender",
  ],
} satisfies Config;
