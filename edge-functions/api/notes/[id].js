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

// GET /api/notes/:id — get a single note
export async function onRequestGet({ params }) {
  // In EdgeOne Pages, KV bindings are injected as global variables (not via env)
  if (typeof notesKV === 'undefined') {
    return jsonResponse({ error: 'KV storage binding (notesKV) is not configured. Please bind notesKV in EdgeOne Pages settings.' }, 503);
  }
  const { id } = params;
  try {
    const raw = await notesKV.get(`note_${id}`);
    if (!raw) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }
    return jsonResponse(JSON.parse(raw));
  } catch (err) {
    return jsonResponse({ error: 'Failed to load note: ' + (err && err.message ? err.message : String(err)) }, 500);
  }
}

// PUT /api/notes/:id — update a note
export async function onRequestPut({ request, params }) {
  // In EdgeOne Pages, KV bindings are injected as global variables (not via env)
  if (typeof notesKV === 'undefined') {
    return jsonResponse({ error: 'KV storage binding (notesKV) is not configured. Please bind notesKV in EdgeOne Pages settings.' }, 503);
  }
  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  try {
    const raw = await notesKV.get(`note_${id}`);
    if (!raw) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    const existing = JSON.parse(raw);
    const title = (body.title !== undefined ? body.title : existing.title).trim();
    const content = body.content !== undefined ? body.content : existing.content;
    const images = body.images !== undefined ? body.images : (existing.images ?? []);

    if (!title) {
      return jsonResponse({ error: 'Title is required' }, 400);
    }

    const now = new Date().toISOString();
    const updated = { ...existing, title, content, images, updatedAt: now };

    // Enforce 25 MB KV size limit
    const updatedJson = JSON.stringify(updated);
    if (new TextEncoder().encode(updatedJson).byteLength > MAX_NOTE_BYTES) {
      return jsonResponse({ error: 'Note size exceeds the 25 MB KV storage limit.' }, 413);
    }

    // Save updated note
    await notesKV.put(`note_${id}`, updatedJson);

    // Update the index entry
    const rawIndex = await notesKV.get('notes_index');
    const index = rawIndex ? JSON.parse(rawIndex) : [];
    const idx = index.findIndex((n) => n.id === id);
    if (idx !== -1) {
      index[idx] = { id, title, updatedAt: now };
    }
    await notesKV.put('notes_index', JSON.stringify(index));

    return jsonResponse(updated);
  } catch (err) {
    return jsonResponse({ error: 'Failed to update note: ' + (err && err.message ? err.message : String(err)) }, 500);
  }
}

// DELETE /api/notes/:id — delete a note
export async function onRequestDelete({ params }) {
  // In EdgeOne Pages, KV bindings are injected as global variables (not via env)
  if (typeof notesKV === 'undefined') {
    return jsonResponse({ error: 'KV storage binding (notesKV) is not configured. Please bind notesKV in EdgeOne Pages settings.' }, 503);
  }
  const { id } = params;
  try {
    const raw = await notesKV.get(`note_${id}`);
    if (!raw) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    // Remove the note
    await notesKV.delete(`note_${id}`);

    // Update the index
    const rawIndex = await notesKV.get('notes_index');
    const index = rawIndex ? JSON.parse(rawIndex) : [];
    const filtered = index.filter((n) => n.id !== id);
    await notesKV.put('notes_index', JSON.stringify(filtered));

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ error: 'Failed to delete note: ' + (err && err.message ? err.message : String(err)) }, 500);
  }
}
