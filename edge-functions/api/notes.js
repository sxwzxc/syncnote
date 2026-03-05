const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/notes — list all notes (returns index with id, title, updatedAt)
export async function onRequestGet({ env }) {
  const raw = await notesKV.get('notes_index');
  const index = raw ? JSON.parse(raw) : [];
  return jsonResponse(index);
}

// POST /api/notes — create a new note
export async function onRequestPost({ request }) {
  const body = await request.json();
  const title = (body.title || '').trim();
  const content = (body.content || '').trim();

  if (!title) {
    return jsonResponse({ error: 'Title is required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const note = { id, title, content, createdAt: now, updatedAt: now };

  // Save the full note
  await notesKV.put(`note_${id}`, JSON.stringify(note));

  // Update the index
  const rawIndex = await notesKV.get('notes_index');
  const index = rawIndex ? JSON.parse(rawIndex) : [];
  index.unshift({ id, title, updatedAt: now });
  await notesKV.put('notes_index', JSON.stringify(index));

  return jsonResponse(note, 201);
}
