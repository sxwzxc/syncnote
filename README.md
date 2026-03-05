# EdgeOne Pages React Router Starter

A comprehensive React Router v7 starter template for EdgeOne Pages, showcasing various rendering modes and full-stack capabilities.

## 🚀 Features

- **Server-Side Rendering (SSR)** - Real-time server-side rendering
- **Client-Side Rendering (CSR)** - Dynamic rendering in the browser
- **Streaming SSR** - Progressive rendering with deferred data loading
- **Static Site Generation (SSG)** - Static generation at build time
- **Pages Functions** - Edge and Node.js serverless functions
- **Modern UI** - Beautiful interface with Tailwind CSS

## 🛠️ Tech Stack

- **React Router v7** - Full-stack React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Lucide React** - Icon library
- **Vite** - Build tool

## 📦 Installation

```bash
# Clone the project
git clone <repository-url>
cd react-router-v7-demo

# Install dependencies
npm install

# Start development server
edgeone pages dev

# deploy the project
edgeone pages deploy
```

Learn more about [EdgeOne CLI](https://pages.edgeone.ai/document/edgeone-cli).

## 🎯 Pages Overview

### Home (/)

Displays project overview and entry points to various feature modules.

### SSR (/ssr)

Demonstrates server-side rendering:

- Re-renders on the server for each request
- Real-time data fetching
- SEO friendly
- Suitable for dynamic content

### CSR (/csr)

Demonstrates client-side rendering:

- All rendering happens in the browser
- Data fetching after JavaScript loads
- Rich interactive experiences
- Reduced server load
- Suitable for interactive applications

### Streaming (/streaming)

Demonstrates streaming SSR:

- Progressive rendering with deferred data loading
- HTML shell sent immediately with fast data
- Slow data streams in as it becomes available
- Optimal user experience with Suspense boundaries
- Works for both SSR and client-side navigation

### Pre-render (/prerender)

Demonstrates static site generation:

- Pre-generates pages at build time
- Fastest loading speed
- CDN friendly
- Suitable for static content

### Pages Functions (/pages-functions)

Demonstrates EdgeOne Pages Functions:

- **Edge Functions** - Ultra-low latency on 3200+ global edge nodes
- **Node Functions** - Full Node.js runtime with npm ecosystem
- Serverless architecture with auto-scaling
- Perfect for APIs and backend logic

## 📁 Project Structure

```
app/
├── components/          # Components
│   ├── ui/             # UI components
│   ├── layout/         # Layout components
│   ├── Header.tsx      # Header navigation
│   ├── Hero.tsx        # Home hero section
│   ├── Features.tsx    # Features showcase
│   └── FeatureCard.tsx # Feature card
├── lib/                # Utility functions
│   └── utils.ts        # Common utilities
├── routes/             # Route pages
│   ├── home.tsx        # Home page
│   ├── ssr.tsx         # SSR demo
│   ├── csr.tsx         # CSR demo
│   ├── streaming.tsx   # Streaming SSR demo
│   ├── prerender.tsx   # Pre-render demo
│   └── pages-functions.tsx    # Pages Functions demo
├── app.css             # Global styles
├── root.tsx            # Root component
└── routes.ts           # Route configuration
edge-functions/         # Edge runtime functions
node-functions/         # Node.js runtime functions
public/                 # Static assets
```

## 📚 Learning Resources

- [EdgeOne Pages Official Documentation](https://pages.edgeone.ai/document/framework-freact-router)
- [React Router v7 Official Documentation](https://reactrouter.com/start/framework)
- [React Router v7 GitHub](https://github.com/remix-run/react-router)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
