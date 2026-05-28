export function middleware(context) {
  return context.next();
}

export const config = {
  matcher: [
    '/',
    '/notes',
    '/api/(.*)',
  ],
};
