// EdgeOne Pages Middleware - for testing middleware functionality
export function middleware(context) {
  const { request, next, redirect, rewrite } = context;
  const urlInfo = new URL(request.url);
  const pathname = urlInfo.pathname;

  // 1. Test redirect: /old-page redirects to home
  if (pathname === '/old-page') {
    return redirect('/');
  }

  // 2. Test rewrite: /api/hello rewrites to edge function
  if (pathname === '/api/hello') {
    return rewrite('/hello-edge');
  }

  // 3. Test direct response: /health returns health check
  if (pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      middleware: 'EdgeOne Pages'
    }), {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  // 4. Test request headers: add custom headers to all matched routes
  return next({
    headers: {
      'x-middleware-timestamp': Date.now().toString(),
      'x-request-path': pathname,
      'x-powered-by': 'EdgeOne-Pages-Middleware',
    }
  });
}

// Middleware matcher configuration
export const config = {
  matcher: [
    '/',              // home page
    '/ssr',           // SSR route
    '/csr',           // CSR route
    '/streaming',     // Streaming route
    '/prerender',     // prerender route
    '/pages-functions', // Pages Functions route
    '/old-page',      // test redirect
    '/api/hello',     // test rewrite to edge function
    '/health',        // test direct response
    '/hello-edge',    // edge function
    '/hello-node',    // node function
  ],
};
