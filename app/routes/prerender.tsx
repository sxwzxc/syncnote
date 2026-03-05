import type { Route } from "./+types/prerender";
import { PageLayout, DemoLayout, DataDisplay } from "~/components/layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pre-render - EdgeOne Pages React Router Starter" },
    {
      name: "description",
      content: "Pre-render demonstration with React Router v7 on EdgeOne Pages",
    },
  ];
}

// Fetch data at build time and pre-render the page
export async function loader({}: Route.LoaderArgs) {
  // This function runs only once at build time, generating static content
  const buildTime = new Date().toISOString();
  const buildId = Math.random().toString(36).substring(7);

  return {
    buildTime,
    buildId,
    staticContent: "This content was generated at build time and cached",
    buildNumber: Math.floor(Math.random() * 1000),
  };
}

// Configure pre-rendering - This is the key configuration for React Router v7
export const handle = {
  // Mark this route to be pre-rendered as a static file
  prerender: true,
};

// This page demonstrates Pre-render
export default function PreRenderPage({ loaderData }: Route.ComponentProps) {
  const { buildTime, buildId, staticContent, buildNumber } = loaderData;
  const codeExample = `// Fetch data at build time and pre-render the page
export async function loader({}: Route.LoaderArgs) {
  // This function runs only once at build time, generating static content
  const buildTime = new Date().toISOString();
  
  return {
    buildTime,
    staticContent: "This content was generated at build time"
  };
}


export default function PreRenderPage({ loaderData }) {
  // This component is pre-rendered to static HTML at build time
  const { buildTime, staticContent } = loaderData;
  
  return (
    <div>
      <h2>Pre-render: Build-time Static Generation</h2>
      <p>This page is pre-rendered at build time.</p>
      <p>Build Time: {buildTime}</p>
      <p>Content: {staticContent}</p>
    </div>
  );
}

// react-router.config.ts
export default {
  ssr: true,
  // Enable pre-rendering functionality
  prerender: [
    "/prerender",
  ],
} satisfies Config;
`;

  const prerenderData = [
    { label: "Build Time", value: buildTime, color: "text-blue-400" },
    { label: "Build ID", value: buildId, color: "text-cyan-400" },
    {
      label: "Build Number",
      value: buildNumber.toString(),
      color: "text-indigo-400",
    },
    {
      label: "Rendering Strategy",
      value: "Pre-render (Build-time)",
      color: "text-green-400",
    },
    {
      label: "Cache Duration",
      value: "Indefinite (until rebuild)",
      color: "text-yellow-400",
    },
    {
      label: "Data Freshness",
      value: "Static (Build-time snapshot)",
      color: "text-orange-400",
    },
  ];

  const prerenderFeatures = [
    {
      title: "Build-time Generation",
      description: "Static HTML generated once at build time",
    },
    {
      title: "Static File Delivery",
      description:
        "Pre-built HTML served directly from CDN without server processing",
    },
    {
      title: "Client-side Hydration",
      description:
        "Static HTML hydrates into interactive SPA with client-side routing",
    },
    {
      title: "SEO Support",
      description:
        "Good for pre-rendered pages, but limited to build-time content",
    },
    {
      title: "Data Staleness",
      description:
        "Content frozen at build time - requires rebuild to update data",
    },
    {
      title: "Performance",
      description: "Instant load with zero server overhead after initial build",
    },
  ];

  const comparisonWithSSR = [
    {
      aspect: "Initial Content",
      nonSSR: "Static HTML from build",
      ssr: "Server-rendered on demand",
      color: "text-cyan-400",
    },
    {
      aspect: "Data Freshness",
      nonSSR: "Stale (build-time only)",
      ssr: "Fresh (per-request)",
      color: "text-orange-400",
    },
    {
      aspect: "SEO Quality",
      nonSSR: "Good (pre-rendered pages)",
      ssr: "Excellent (real-time)",
      color: "text-green-400",
    },
    {
      aspect: "Hydration",
      nonSSR: "Static → SPA",
      ssr: "Server HTML → Interactive",
      color: "text-purple-400",
    },
    {
      aspect: "Routing",
      nonSSR: "Client-side after hydration",
      ssr: "Server + client hybrid",
      color: "text-blue-400",
    },
    {
      aspect: "Performance",
      nonSSR: "Instant (no server wait)",
      ssr: "Slower (server processing)",
      color: "text-yellow-400",
    },
  ];

  return (
    <PageLayout>
      <DemoLayout
        title="Pre-render"
        subtitle="Static HTML generation at build time for instant delivery."
        description="Ideal for blogs, docs, and marketing pages. In non-SSR mode, serves pre-built static HTML (fast but frozen at build time). In SSR mode, can still render fresh content per request. Compare with SSR page to see real-time data differences."
        codeExample={codeExample}
        renderMode="Pre-render"
        dataDisplay={
          <div className="space-y-8">
            <DataDisplay
              title="Pre-render: Build-time Static Generation"
              description="This page uses Pre-render to generate static HTML at build time. In non-SSR mode, content is frozen at build time. In SSR mode, it can still fetch fresh data per request."
              data={prerenderData}
              features={prerenderFeatures}
            />

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Pre-render: SSR Mode vs Non-SSR Mode
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonWithSSR.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {item.aspect}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Non-SSR:</span>
                        <div className={`${item.color} font-medium`}>
                          {item.nonSSR}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">SSR Mode:</span>
                        <div className="text-gray-700">{item.ssr}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  💡 <strong>Key Insight:</strong> With pre-render enabled,
                  non-SSR mode serves static HTML from build time (fast but
                  stale), while SSR mode renders fresh content per request
                  (slower but always up-to-date). Visit the SSR page to compare
                  real-time data!
                </p>
              </div>
            </div>
          </div>
        }
      />
    </PageLayout>
  );
}
