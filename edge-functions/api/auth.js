const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      ...CORS_HEADERS,
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// POST /api/auth — verify password
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const { password } = body;
  const expectedPassword = env.password;

  if (!expectedPassword) {
    // No password configured — access is open
    return jsonResponse({ ok: true });
  }

  if (!password || password !== expectedPassword) {
    return jsonResponse({ error: 'Incorrect password' }, 401);
  }

  return jsonResponse({ ok: true });
}
