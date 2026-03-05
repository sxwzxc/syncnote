import type { Route } from "./+types/ssr";
import { PageLayout, DemoLayout, DataDisplay } from "~/components/layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SSR - EdgeOne Pages React Router Starter" },
    {
      name: "description",
      content: "Server-Side Rendering demonstration with React Router v7 on EdgeOne Pages",
    },
  ];
}

// Simulate fetching data from API, re-fetching every time
async function getSSRData() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Get request headers to prove this runs on server
  const timestamp = Date.now();

  return {
    requestTime: new Date().toISOString(),
    serverTime: new Date().toISOString(),
    dataFetchTime: new Date().toISOString(),
    realtimeValue: Math.floor(Math.random() * 1000),
    timestamp: timestamp,
    serverHash: Math.random().toString(36).substring(7),
  };
}

export async function loader({}: Route.LoaderArgs) {
  // This function is executed every time a request is made
  const data = await getSSRData();
  return { data };
}

// This page demonstrates Server-Side Rendering
export default function SSRPage({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;

  const codeExample = `export async function loader({}: Route.LoaderArgs) {
  // This function runs on the server for EVERY request
  const data = await fetch('https://api.example.com/real-time-data', {
    cache: 'no-store' // Disable cache - ensures fresh data every time
  });
  
  const jsonData = await data.json();
  
  return { data: jsonData };
}

export default function SSRPage({ loaderData }: Route.ComponentProps) {
  const { data } = loaderData;
  
  return (
    <div>
      <h2>SSR: Server-Side Rendering</h2>
      <p>This page is rendered on the server for every request.</p>
      <p>Request Time: {new Date().toISOString()}</p>
      <p>Server Time: {new Date().toISOString()}</p>
      <p>Real-time Data: {data.value}</p>
    </div>
  );
}`;

  const ssrData = [
    { label: "Request Time", value: data.requestTime, color: "text-green-400" },
    { label: "Server Time", value: data.serverTime, color: "text-blue-400" },
    {
      label: "Data Fetch Time",
      value: data.dataFetchTime,
      color: "text-yellow-400",
    },
    {
      label: "Real-time Value",
      value: data.realtimeValue,
      color: "text-purple-400",
    },
    { label: "Timestamp", value: data.timestamp, color: "text-red-400" },
    { label: "Server Hash", value: data.serverHash, color: "text-indigo-400" },
  ];

  const ssrFeatures = [
    {
      title: "Server-Side Rendering",
      description: "Each request is rendered on the server with fresh data",
    },
    {
      title: "Dynamic Content",
      description: "Content is always up-to-date and can be personalized",
    },
    {
      title: "Full SEO Support",
      description:
        "Search engines receive fully rendered HTML with real-time content",
    },
    {
      title: "Server Processing",
      description: "Requires server computation for each request",
    },
    {
      title: "Client Hydration",
      description:
        "Server HTML becomes interactive after client-side hydration",
    },
    {
      title: "Flexible Routing",
      description: "Supports both server-side and client-side navigation",
    },
  ];

  const comparisonWithPrerender = [
    {
      aspect: "Rendering Mode",
      ssr: "Always server-rendered",
      prerender: "Pre-rendered at build (SSR) or static (non-SSR)",
      color: "text-cyan-400",
    },
    {
      aspect: "Data in SSR Mode",
      ssr: "Fresh per request",
      prerender: "Can be fresh (if SSR enabled) or stale (non-SSR)",
      color: "text-green-400",
    },
    {
      aspect: "Data in Non-SSR",
      ssr: "N/A (requires SSR)",
      prerender: "Static build-time snapshot",
      color: "text-orange-400",
    },
    {
      aspect: "Performance",
      ssr: "Slower (server processing)",
      prerender: "Faster (especially in non-SSR mode)",
      color: "text-yellow-400",
    },
    {
      aspect: "Server Load",
      ssr: "High (per request)",
      prerender: "Low (SSR) or Zero (non-SSR)",
      color: "text-red-400",
    },
    {
      aspect: "Best For",
      ssr: "Always-fresh dynamic content",
      prerender: "Content that can be cached or pre-generated",
      color: "text-blue-400",
    },
  ];

  return (
    <PageLayout>
      <DemoLayout
        title="SSR"
        subtitle="Server-side rendering on every request with always-fresh data."
        description="Perfect for dynamic, personalized content requiring real-time data and full SEO support."
        codeExample={codeExample}
        renderMode="SSR"
        dataDisplay={
          <div className="space-y-8">
            <DataDisplay
              title="SSR: Server-Side Rendering"
              description="This route always renders on the server for each request, fetching fresh data every time. Refresh the page to see updated timestamps and values."
              data={ssrData}
              features={ssrFeatures}
            />

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                SSR vs Pre-render Comparison
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonWithPrerender.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {item.aspect}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">SSR Route:</span>
                        <div className={`${item.color} font-medium`}>
                          {item.ssr}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Pre-render Route:</span>
                        <div className="text-gray-700">{item.prerender}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm">
                  🔄 <strong>Key Difference:</strong> SSR routes always render
                  on the server per request. Pre-render routes can work in both
                  SSR mode (fresh data) and non-SSR mode (static build-time
                  data). Visit the Pre-render page to explore both behaviors!
                </p>
              </div>
            </div>
          </div>
        }
      />
    </PageLayout>
  );
}
