import { Button } from "~/components/ui/button";

interface DemoLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  codeExample: string;
  renderMode: string;
  dataDisplay: React.ReactNode;
  additionalInfo?: string;
}

export const DemoLayout = ({
  title,
  subtitle,
  description,
  codeExample,
  renderMode,
  dataDisplay,
  additionalInfo,
}: DemoLayoutProps) => {
  return (
    <>
      {/* Main title area */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          EdgeOne Pages React Router Starter - {title}
        </h1>
        <p className="text-xl text-gray-600 mb-4">{subtitle}</p>
        <p className="text-lg text-gray-500 mb-8">{description}</p>
        <a
          href="https://pages.edgeone.ai/document/framework-freact-router"
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

      {/* Dynamic data display area */}
      <div className="container mx-auto px-4 mb-8">{dataDisplay}</div>

      {/* Additional info area (optional) */}
      {additionalInfo && (
        <div className="container mx-auto px-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <span>Entry Files Setup</span>
            </h3>
            <div className="space-y-5">
              {additionalInfo.split("\n\n").map((para, index) => {
                // Check if paragraph starts with **
                if (para.trim().startsWith("**")) {
                  const parts = para.split("**");
                  const title = parts[1];
                  const content = parts.slice(2).join("**");

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-5 border border-gray-200"
                    >
                      <h4 className="text-base font-semibold text-primary mb-3 font-mono">
                        {title}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {content.replace(/^:\s*/, "")}
                      </p>
                    </div>
                  );
                }

                return (
                  <p
                    key={index}
                    className="text-gray-600 text-base leading-relaxed bg-white rounded-lg p-4 border-l-4 border-primary"
                  >
                    {para}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Code example area */}
      <div className="container mx-auto px-4 mb-20">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="bg-gray-900 rounded p-6 text-left">
            <pre className="text-sm overflow-x-auto">
              <code className="text-gray-100">{codeExample}</code>
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};
