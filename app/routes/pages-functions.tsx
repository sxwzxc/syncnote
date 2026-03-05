import type { Route } from "./+types/pages-functions";
import { PageLayout } from "~/components/layout";
import { Button } from "~/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Pages Functions - EdgeOne Pages React Router Starter" },
    {
      name: "description",
      content:
        "Serverless functions demonstration with React Router v7 on EdgeOne Pages",
    },
  ];
}

// This page demonstrates Pages Functions (Edge & Node)
export default function PagesFunctionsPage() {
  const [isEdgeLoading, setIsEdgeLoading] = useState(false);
  const [edgeData, setEdgeData] = useState("");
  const [isNodeLoading, setIsNodeLoading] = useState(false);
  const [nodeData, setNodeData] = useState("");

  const handleEdgeClick = async () => {
    setIsEdgeLoading(true);
    try {
      const res = await fetch("/hello-edge");
      const text = await res.text();
      setEdgeData(text);
    } catch (error) {
      setEdgeData("Error: Could not fetch data from Edge function");
    }
    setIsEdgeLoading(false);
  };

  const handleNodeClick = async () => {
    setIsNodeLoading(true);
    try {
      const res = await fetch("/hello-node");
      const text = await res.text();
      setNodeData(text);
    } catch (error) {
      setNodeData("Error: Could not fetch data from Node function");
    }
    setIsNodeLoading(false);
  };

  return (
    <PageLayout>
      {/* Main title area */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          EdgeOne Pages React Router Starter - Pages Functions
        </h1>
        <p className="text-xl text-gray-600 mb-4">
          Pages Functions is a serverless architecture solution that allows you
          to run server-side code without configuring or managing servers.
        </p>
        <p className="text-lg text-gray-500 mb-8">
          Supports auto-scaling, global edge deployment, API development, and
          database connections for seamless full-stack integration.
        </p>
        <a
          href="https://pages.edgeone.ai/document/pages-functions-overview"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="lg"
            variant="outline"
            className="hover:bg-gray-50 text-gray-700 px-8 py-3 text-lg cursor-pointer border-gray-300"
          >
            View Documentation
          </Button>
        </a>
      </div>

      {/* Edge Functions Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Edge Functions
          </h2>
          <p className="text-lg text-gray-700 mb-3">
            Run code on 3200+ global edge nodes with ultra-low latency and
            elastic auto-scaling.
          </p>
          <p className="text-base text-gray-600 mb-6">
            Ideal for high-concurrency, latency-sensitive scenarios like
            lightweight APIs, real-time notifications, content personalization,
            and A/B testing. Millisecond cold start with short execution time.
          </p>

          {/* Code example */}
          <div className="bg-gray-900 rounded p-6 text-left mb-6">
            <pre className="text-sm overflow-x-auto">
              <code className="text-gray-100">{`// edge-functions/hello.js
export default function onRequest(context) {
  const { geo, request } = context;

  // Get request headers added by middleware
  const middlewareHeaders = {
    'x-middleware-timestamp': request.headers.get('x-middleware-timestamp'),
    'x-request-path': request.headers.get('x-request-path'),
    'x-powered-by': request.headers.get('x-powered-by'),
  };

  return new Response(JSON.stringify({
    message: 'Hello Edge!',
    geo: geo,
    middlewareHeaders: middlewareHeaders,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}`}</code>
            </pre>
          </div>

          {/* Execute button */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <Button
              onClick={handleEdgeClick}
              disabled={isEdgeLoading}
              className="bg-primary hover:bg-primary-dark text-white cursor-pointer"
            >
              {isEdgeLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Execute Edge Function
            </Button>

            {edgeData && (
              <div className="space-y-2 text-left overflow-hidden mt-4">
                <p className="text-gray-700">
                  <span className="text-primary font-medium">
                    Function Return:
                  </span>{" "}
                  {edgeData}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Functions Section */}
      <div className="container mx-auto px-4 mb-20">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Node Functions
          </h2>
          <p className="text-lg text-gray-700 mb-3">
            Full Node.js runtime with rich npm ecosystem and native modules for
            powerful server-side processing.
          </p>
          <p className="text-base text-gray-600 mb-6">
            Perfect for Node.js-dependent workloads, complex data processing,
            database operations, and third-party integrations. Runs in cloud
            centers with support for long-running tasks.
          </p>

          {/* Code example */}
          <div className="bg-gray-900 rounded p-6 text-left mb-6">
            <pre className="text-sm overflow-x-auto">
              <code className="text-gray-100">{`// node-functions/hello.js
export default function onRequest(context) {
  const { request } = context;

  // Get request headers added by middleware
  const middlewareHeaders = {
    'x-middleware-timestamp': request.headers.get('x-middleware-timestamp'),
    'x-request-path': request.headers.get('x-request-path'),
    'x-powered-by': request.headers.get('x-powered-by'),
  };

  return new Response(JSON.stringify({
    message: 'Hello Node!',
    middlewareHeaders: middlewareHeaders,
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}`}</code>
            </pre>
          </div>

          {/* Execute button */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
            <Button
              onClick={handleNodeClick}
              disabled={isNodeLoading}
              className="bg-primary hover:bg-primary-dark text-white cursor-pointer"
            >
              {isNodeLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Execute Node Function
            </Button>

            {nodeData && (
              <div className="space-y-2 text-left overflow-hidden mt-4">
                <p className="text-gray-700">
                  <span className="text-primary font-medium">
                    Function Return:
                  </span>{" "}
                  {nodeData}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
