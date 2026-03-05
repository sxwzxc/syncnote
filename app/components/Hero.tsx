import { Button } from "~/components/ui/button";
import { Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="w-full py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          EdgeOne Pages React Router Starter
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
          Build high-performance, scalable web applications using React Router
          v7. Leverage complete full-stack rendering modes including SSR and
          Pre-render, while building dynamic APIs and complex backend features.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://console.tencentcloud.com/edgeone/pages/new?from=github&template=react-router-mix-render-template"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3 text-lg cursor-pointer"
            >
              <Zap className="w-5 h-5 mr-2" />
              One-Click Deployment
            </Button>
          </a>
          <a
            href="https://pages.edgeone.ai/document/framework-freact-router"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              View Documentation
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
