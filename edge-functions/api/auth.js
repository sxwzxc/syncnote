import { jsonResponse, handleOptions } from '../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

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
    return jsonResponse({ ok: true });
  }

  if (!password || password !== expectedPassword) {
    return jsonResponse({ error: 'Incorrect password' }, 401);
  }

  return jsonResponse({ ok: true });
}
