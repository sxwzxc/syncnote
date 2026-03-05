// EdgeOne Pages Middleware
export function middleware(context) {
  const { request, next } = context;
  const urlInfo = new URL(request.url);
  const pathname = urlInfo.pathname;

  return next({
    headers: {
      'x-request-path': pathname,
    }
  });
}

// Middleware matcher configuration
export const config = {
  matcher: [
    '/',
    '/notes',
    '/api/(.*)',
  ],
};
