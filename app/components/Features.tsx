import FeatureCard from "./FeatureCard";

const Features = () => {
  const features = [
    {
      title: "Server-Side Rendering (SSR)",
      description: "Real-time rendering through the server after each request",
      demoLink: "/ssr",
    },
    {
      title: "Client-Side Rendering (CSR)",
      description: "Dynamic rendering in the browser for interactive experiences",
      demoLink: "/csr",
    },
    {
      title: "Pre-render",
      description:
        "Pre-generate static pages at build time for maximum performance",
      demoLink: "/prerender",
    },
    {
      title: "Streaming-SSR",
      description:
        "Progressive rendering with deferred data for optimal performance",
      demoLink: "/streaming",
    },
    {
      title: "Pages Functions",
      description: "Serverless functions with Edge & Node runtime, no server management required",
      demoLink: "/pages-functions",
    },
  ];

  return (
    <section className="w-full pb-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              demoLink={feature.demoLink}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
