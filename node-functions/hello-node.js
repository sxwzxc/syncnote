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
}