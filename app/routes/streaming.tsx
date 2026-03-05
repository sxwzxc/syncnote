import { Suspense } from "react";
import { Await } from "react-router";
import type { Route } from "./+types/streaming";
import { PageLayout, DemoLayout, DataDisplay } from "~/components/layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Streaming - EdgeOne Pages React Router Starter" },
    {
      name: "description",
      content: "Streaming SSR demonstration with deferred data loading",
    },
  ];
}

// Fast data - returns immediately
async function getFastData() {
  return {
    message: "This loaded instantly!",
    timestamp: new Date().toISOString(),
    type: "fast",
  };
}

// Slow data - simulates a slow API call
async function getSlowData() {
  // Simulate a 3-second delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    message: "This took 3 seconds to load!",
    timestamp: new Date().toISOString(),
    type: "slow",
    randomValue: Math.floor(Math.random() * 1000),
    serverHash: Math.random().toString(36).substring(7),
  };
}

// Very slow data - simulates an even slower API call
async function getVerySlowData() {
  // Simulate a 5-second delay
  await new Promise((resolve) => setTimeout(resolve, 5000));

  return {
    message: "This took 5 seconds to load!",
    timestamp: new Date().toISOString(),
    type: "very-slow",
    randomValue: Math.floor(Math.random() * 1000),
    complexData: {
      nested: "data",
      array: [1, 2, 3, 4, 5],
    },
  };
}

// Server-side loader - return Promises directly for streaming
export async function loader({}: Route.LoaderArgs) {
  // Get fast data immediately
  const fastData = await getFastData();

  // Don't await slow data - keep as Promises
  // This allows the HTML shell to be sent immediately
  const slowData = getSlowData();
  const verySlowData = getVerySlowData();

  // In v7, just return the object with Promises directly
  return {
    fastData,
    slowData,
    verySlowData,
  };
}

// Client-side loader - also supports streaming on navigation
export async function clientLoader({}: Route.ClientLoaderArgs) {
  // Same logic as server loader
  const fastData = await getFastData();
  const slowData = getSlowData();
  const verySlowData = getVerySlowData();

  // Return object with Promises directly
  return {
    fastData,
    slowData,
    verySlowData,
  };
}

// Enable hydration for client-side navigation
clientLoader.hydrate = true;

export default function StreamingPage({ loaderData }: Route.ComponentProps) {
  const { fastData, slowData, verySlowData } = loaderData;

  const codeExample = `import { Suspense } from "react";
import { Await } from "react-router";

// Fast data - returns immediately
async function getFastData() {
  return { message: "Instant!" };
}

// Slow data - takes 3 seconds
async function getSlowData() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return { message: "Took 3 seconds!" };
}

// Server loader - return Promise directly (v7)
export async function loader() {
  const fastData = await getFastData();
  const slowData = getSlowData(); // Don't await!
  
  // Just return object with Promise - no defer() needed in v7
  return {
    fastData,
    slowData, // This Promise will stream
  };
}

// Client loader - same pattern for navigation
export async function clientLoader() {
  const fastData = await getFastData();
  const slowData = getSlowData();
  
  return {
    fastData,
    slowData,
  };
}

clientLoader.hydrate = true;

export default function StreamingPage({ loaderData }) {
  return (
    <div>
      {/* Fast data renders immediately */}
      <h2>Fast Data: {loaderData.fastData.message}</h2>
      
      {/* Slow data streams in later */}
      <Suspense fallback={<div>Loading slow data...</div>}>
        <Await resolve={loaderData.slowData}>
          {(data) => <p>Slow Data: {data.message}</p>}
        </Await>
      </Suspense>
    </div>
  );
}`;

  const entrySetupInfo = `React Router v7 enables streaming SSR by returning unresolved Promises directly from loaders. When the server encounters a Promise, it sends the initial HTML shell immediately with Suspense fallbacks, then streams resolved data as script tags that hydrate into the page. This requires proper configuration in both entry files to handle the streaming lifecycle.

**entry.server.tsx**: Uses renderToPipeableStream with onShellReady callback to send the initial HTML shell immediately (for users) or onAllReady (for bots). The stream pipes React's rendered output through a PassThrough stream to a Web ReadableStream, enabling progressive HTML delivery as deferred Promises resolve.

**entry.client.tsx**: Uses hydrateRoot wrapped in startTransition to hydrate the server-rendered HTML. The HydratedRouter automatically picks up streamed data and seamlessly transitions from server-rendered fallbacks to resolved content without full re-renders.`;

  const streamingFeatures = [
    {
      title: "Instant Shell",
      description: "HTML shell with fast data arrives immediately",
    },
    {
      title: "Progressive Enhancement",
      description: "Slow data streams in as it becomes available",
    },
    {
      title: "Better UX",
      description: "Users see content faster instead of waiting for everything",
    },
    {
      title: "Server Streaming",
      description: "Uses renderToPipeableStream to send HTML in chunks",
    },
    {
      title: "Client Navigation",
      description: "Works for both SSR and client-side navigation",
    },
    {
      title: "Suspense Boundaries",
      description: "React Suspense handles loading states automatically",
    },
  ];

  const fastDataDisplay = [
    { label: "Message", value: fastData.message, color: "text-green-400" },
    { label: "Timestamp", value: fastData.timestamp, color: "text-blue-400" },
    { label: "Type", value: fastData.type, color: "text-purple-400" },
  ];

  return (
    <PageLayout>
      <DemoLayout
        title="Streaming SSR"
        subtitle="Progressive rendering with deferred data loading for optimal performance."
        description="The page shell and fast data arrive instantly, while slow data streams in progressively. This provides the best user experience by showing content as soon as possible."
        codeExample={codeExample}
        additionalInfo={entrySetupInfo}
        renderMode="Streaming"
        dataDisplay={
          <div className="space-y-8">
            {/* Fast Data - Renders Immediately */}
            <DataDisplay
              title="⚡ Fast Data (Instant)"
              description="This data loaded immediately and was included in the initial HTML response. The page shell arrived in milliseconds!"
              data={fastDataDisplay}
              features={streamingFeatures}
            />

            {/* Slow Data - Streams In */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🌊 Slow Data (Streaming - 3 seconds)
              </h3>
              <p className="text-gray-600 mb-4">
                This data is being fetched in the background and will stream in
                when ready. Watch the loading state!
              </p>
              <Suspense
                fallback={
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
                      <span className="text-yellow-800 font-medium">
                        Loading slow data... (3 seconds)
                      </span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-2">
                      The page is already interactive! You can scroll and
                      interact while this loads.
                    </p>
                  </div>
                }
              >
                <Await resolve={slowData}>
                  {(data) => (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 text-sm">Message</span>
                          <div className="text-green-600 font-medium">
                            {data.message}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">
                            Timestamp
                          </span>
                          <div className="text-blue-600 font-medium">
                            {data.timestamp}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">
                            Random Value
                          </span>
                          <div className="text-purple-600 font-medium">
                            {data.randomValue}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">
                            Server Hash
                          </span>
                          <div className="text-indigo-600 font-medium">
                            {data.serverHash}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-green-700 text-sm">
                        ✅ Streamed successfully after 3 seconds!
                      </div>
                    </div>
                  )}
                </Await>
              </Suspense>
            </div>

            {/* Very Slow Data - Streams In Even Later */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🐌 Very Slow Data (Streaming - 5 seconds)
              </h3>
              <p className="text-gray-600 mb-4">
                This data takes even longer to fetch. Notice how the page is
                fully functional while waiting!
              </p>
              <Suspense
                fallback={
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                      <span className="text-orange-800 font-medium">
                        Loading very slow data... (5 seconds)
                      </span>
                    </div>
                    <p className="text-orange-700 text-sm mt-2">
                      Still loading, but the rest of the page is already
                      rendered and interactive!
                    </p>
                  </div>
                }
              >
                <Await resolve={verySlowData}>
                  {(data) => (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 text-sm">Message</span>
                          <div className="text-blue-600 font-medium">
                            {data.message}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">
                            Timestamp
                          </span>
                          <div className="text-green-600 font-medium">
                            {data.timestamp}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">
                            Random Value
                          </span>
                          <div className="text-purple-600 font-medium">
                            {data.randomValue}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">
                            Complex Data
                          </span>
                          <div className="text-yellow-600 font-medium">
                            {JSON.stringify(data.complexData)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 text-blue-700 text-sm">
                        ✅ Streamed successfully after 5 seconds!
                      </div>
                    </div>
                  )}
                </Await>
              </Suspense>
            </div>

            {/* How It Works */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                🔍 How Streaming Works
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    1. Server Receives Request
                  </h4>
                  <p className="text-gray-600 text-sm">
                    The loader starts executing. Fast data is awaited, slow data
                    is returned as Promise (not awaited).
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    2. Initial HTML Chunk Sent
                  </h4>
                  <p className="text-gray-600 text-sm">
                    React's renderToPipeableStream sends the HTML shell with
                    fast data immediately. The browser can start rendering!
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    3. Suspense Boundaries Show Fallbacks
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Areas waiting for slow data show loading states. The page is
                    already interactive!
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    4. Slow Data Streams In
                  </h4>
                  <p className="text-gray-600 text-sm">
                    As Promises resolve, React streams additional HTML chunks to
                    replace the fallbacks.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">
                    5. Client-Side Navigation
                  </h4>
                  <p className="text-gray-600 text-sm">
                    The clientLoader uses the same Promise pattern, so
                    navigation feels instant even with slow data!
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                ✨ Benefits of Streaming
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">
                    Faster Time to First Byte (TTFB)
                  </h4>
                  <p className="text-gray-700 text-sm">
                    The server sends HTML immediately without waiting for all
                    data
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">
                    Better Perceived Performance
                  </h4>
                  <p className="text-gray-700 text-sm">
                    Users see content faster and can interact sooner
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-purple-600 mb-2">
                    Progressive Enhancement
                  </h4>
                  <p className="text-gray-700 text-sm">
                    Content appears progressively as data becomes available
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-yellow-600 mb-2">
                    Optimal Resource Usage
                  </h4>
                  <p className="text-gray-700 text-sm">
                    Server doesn't block on slow operations, improving
                    throughput
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    </PageLayout>
  );
}
