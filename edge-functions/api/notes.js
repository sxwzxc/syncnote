const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// EdgeOne KV max value size is 25 MB
const MAX_NOTE_BYTES = 25 * 1024 * 1024;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      ...CORS_HEADERS,
    },
  });
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/notes — list all notes (returns index with id, title, updatedAt)
export async function onRequestGet({ env }) {
  try {
    const raw = await env.notesKV.get('notes_index');
    const index = raw ? JSON.parse(raw) : [];
    return jsonResponse(index);
  } catch (err) {
    return jsonResponse({ error: 'Failed to load notes: ' + (err && err.message ? err.message : String(err)) }, 500);
  }
}

// POST /api/notes — create a new note
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const title = (body.title || '').trim();
  const content = body.content !== undefined ? body.content : '';

  if (!title) {
    return jsonResponse({ error: 'Title is required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const note = { id, title, content, createdAt: now, updatedAt: now };

  // Enforce 25 MB KV size limit
  const noteJson = JSON.stringify(note);
  if (new TextEncoder().encode(noteJson).byteLength > MAX_NOTE_BYTES) {
    return jsonResponse({ error: 'Note size exceeds the 25 MB KV storage limit.' }, 413);
  }

  try {
    // Save the full note
    await env.notesKV.put(`note_${id}`, noteJson);

    // Update the index
    const rawIndex = await env.notesKV.get('notes_index');
    const index = rawIndex ? JSON.parse(rawIndex) : [];
    index.unshift({ id, title, updatedAt: now });
    await env.notesKV.put('notes_index', JSON.stringify(index));
  } catch (err) {
    return jsonResponse({ error: 'Failed to save note: ' + (err && err.message ? err.message : String(err)) }, 500);
  }

  return jsonResponse(note, 201);
}
