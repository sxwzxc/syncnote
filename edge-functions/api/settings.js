const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SETTINGS_KEY = 'syncnote_settings';
const DEFAULT_SETTINGS = {
  weatherMode: 'auto', // auto | manual
  weatherLocation: '', // manual location text
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

function getClientIp(request) {
  const candidates = [
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-client-ip'),
  ];

  for (const value of candidates) {
    if (!value) continue;
    const ip = value.split(',')[0].trim();
    if (ip) return ip;
  }
  return 'Unknown';
}

async function readSettings() {
  const raw = await notesKV.get(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const parsed = JSON.parse(raw);
    return {
      weatherMode: parsed.weatherMode === 'manual' ? 'manual' : 'auto',
      weatherLocation: typeof parsed.weatherLocation === 'string' ? parsed.weatherLocation : '',
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request }) {
  // In EdgeOne Pages, KV bindings are injected as global variables (not via env)
  if (typeof notesKV === 'undefined') {
    return jsonResponse({ error: 'KV storage binding (notesKV) is not configured. Please bind notesKV in EdgeOne Pages settings.' }, 503);
  }

  try {
    const settings = await readSettings();
    return jsonResponse({
      ...settings,
      ip: getClientIp(request),
    });
  } catch (err) {
    return jsonResponse({ error: 'Failed to load settings: ' + (err && err.message ? err.message : String(err)) }, 500);
  }
}

export async function onRequestPut({ request }) {
  // In EdgeOne Pages, KV bindings are injected as global variables (not via env)
  if (typeof notesKV === 'undefined') {
    return jsonResponse({ error: 'KV storage binding (notesKV) is not configured. Please bind notesKV in EdgeOne Pages settings.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const weatherMode = body.weatherMode === 'manual' ? 'manual' : 'auto';
  const weatherLocation = typeof body.weatherLocation === 'string' ? body.weatherLocation.trim() : '';

  if (weatherMode === 'manual' && !weatherLocation) {
    return jsonResponse({ error: 'Weather location is required in manual mode' }, 400);
  }

  const next = { weatherMode, weatherLocation };

  try {
    await notesKV.put(SETTINGS_KEY, JSON.stringify(next));
    return jsonResponse(next);
  } catch (err) {
    return jsonResponse({ error: 'Failed to save settings: ' + (err && err.message ? err.message : String(err)) }, 500);
  }
}
