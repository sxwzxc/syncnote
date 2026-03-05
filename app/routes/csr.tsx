import { useState, useEffect } from "react";
import type { Route } from "./+types/csr";
import { PageLayout, DemoLayout, DataDisplay } from "~/components/layout";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CSR - EdgeOne Pages React Router Starter" },
    {
      name: "description",
      content: "Client-Side Rendering demonstration with React Router v7 on EdgeOne Pages",
    },
  ];
}

// CSR page - no loader needed, all data fetching happens on the client
export default function CSRPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counter, setCounter] = useState(0);

  // Simulate client-side data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const timestamp = Date.now();
      setData({
        clientTime: new Date().toISOString(),
        dataFetchTime: new Date().toISOString(),
        realtimeValue: Math.floor(Math.random() * 1000),
        timestamp: timestamp,
        clientHash: Math.random().toString(36).substring(7),
        userAgent: navigator.userAgent,
      });
      setLoading(false);
    };

    fetchData();
  }, [counter]);

  const codeExample = `import { useState, useEffect } from "react";

export default function CSRPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Data fetching happens on the client side
    const fetchData = async () => {
      setLoading(true);
      const response = await fetch('https://api.example.com/data');
      const jsonData = await response.json();
      setData(jsonData);
      setLoading(false);
    };

    fetchData();
  }, []); // Runs once when component mounts

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>CSR: Client-Side Rendering</h2>
      <p>This page is rendered entirely on the client.</p>
      <p>Client Time: {new Date().toISOString()}</p>
      <p>Data: {JSON.stringify(data)}</p>
    </div>
  );
}`;

  const csrData = data
    ? [
        { label: "Client Time", value: data.clientTime, color: "text-green-400" },
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
        { label: "Client Hash", value: data.clientHash, color: "text-indigo-400" },
        {
          label: "User Agent",
          value: data.userAgent.substring(0, 50) + "...",
          color: "text-cyan-400",
        },
      ]
    : [];

  const csrFeatures = [
    {
      title: "Client-Side Rendering",
      description: "All rendering happens in the browser after initial page load",
    },
    {
      title: "Dynamic Interactions",
      description: "Rich interactive experiences without page reloads",
    },
    {
      title: "Reduced Server Load",
      description: "Server only serves static HTML, CSS, and JavaScript",
    },
    {
      title: "Browser APIs",
      description: "Full access to browser APIs and client-side storage",
    },
    {
      title: "Fast Navigation",
      description: "Instant client-side routing between pages",
    },
    {
      title: "SEO Considerations",
      description: "Requires additional setup for search engine optimization",
    },
  ];

  const comparisonWithSSR = [
    {
      aspect: "Initial Load",
      csr: "Blank page, then content appears",
      ssr: "Fully rendered HTML immediately",
      color: "text-cyan-400",
    },
    {
      aspect: "Data Fetching",
      csr: "After JavaScript loads",
      ssr: "Before HTML is sent",
      color: "text-green-400",
    },
    {
      aspect: "SEO",
      csr: "Requires extra work",
      ssr: "Built-in support",
      color: "text-orange-400",
    },
    {
      aspect: "Time to Interactive",
      csr: "Slower (download + execute JS)",
      ssr: "Faster (HTML ready)",
      color: "text-yellow-400",
    },
    {
      aspect: "Server Load",
      csr: "Minimal (static files)",
      ssr: "Higher (per-request rendering)",
      color: "text-red-400",
    },
    {
      aspect: "Best For",
      csr: "Interactive apps, dashboards",
      ssr: "Content sites, SEO-critical pages",
      color: "text-blue-400",
    },
  ];

  return (
    <PageLayout>
      <DemoLayout
        title="CSR"
        subtitle="Client-side rendering with data fetching in the browser."
        description="Perfect for interactive applications where SEO is not critical and you want to minimize server load."
        codeExample={codeExample}
        renderMode="CSR"
        dataDisplay={
          <div className="space-y-8">
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center shadow-sm">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">Loading data on the client...</p>
              </div>
            ) : (
              <>
                <DataDisplay
                  title="CSR: Client-Side Rendering"
                  description="This route renders entirely on the client. Data is fetched after the JavaScript loads and executes in the browser. Click 'Refresh Data' to fetch new data without reloading the page."
                  data={csrData}
                  features={csrFeatures}
                />

                <div className="flex justify-center">
                  <button
                    onClick={() => setCounter(counter + 1)}
                    className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
                  >
                    Refresh Data (Client-Side)
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    CSR vs SSR Comparison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comparisonWithSSR.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          {item.aspect}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600">CSR Route:</span>
                            <div className={`${item.color} font-medium`}>
                              {item.csr}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">SSR Route:</span>
                            <div className="text-gray-700">{item.ssr}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800 text-sm">
                      💡 <strong>Key Difference:</strong> CSR routes render in
                      the browser after JavaScript loads. SSR routes render on
                      the server before sending HTML to the client. CSR is great
                      for interactive apps, while SSR is better for SEO and
                      initial load performance.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        }
      />
    </PageLayout>
  );
}
