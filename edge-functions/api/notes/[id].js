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

// GET /api/notes/:id — get a single note
export async function onRequestGet({ params }) {
  const { id } = params;
  const raw = await notesKV.get(`note_${id}`);
  if (!raw) {
    return jsonResponse({ error: 'Note not found' }, 404);
  }
  return jsonResponse(JSON.parse(raw));
}

// PUT /api/notes/:id — update a note
export async function onRequestPut({ request, params }) {
  const { id } = params;
  const raw = await notesKV.get(`note_${id}`);
  if (!raw) {
    return jsonResponse({ error: 'Note not found' }, 404);
  }

  const existing = JSON.parse(raw);
  const body = await request.json();
  const title = (body.title !== undefined ? body.title : existing.title).trim();
  const content = body.content !== undefined ? body.content : existing.content;

  if (!title) {
    return jsonResponse({ error: 'Title is required' }, 400);
  }

  const now = new Date().toISOString();
  const updated = { ...existing, title, content, updatedAt: now };

  // Save updated note
  await notesKV.put(`note_${id}`, JSON.stringify(updated));

  // Update the index entry
  const rawIndex = await notesKV.get('notes_index');
  const index = rawIndex ? JSON.parse(rawIndex) : [];
  const idx = index.findIndex((n) => n.id === id);
  if (idx !== -1) {
    index[idx] = { id, title, updatedAt: now };
  }
  await notesKV.put('notes_index', JSON.stringify(index));

  return jsonResponse(updated);
}

// DELETE /api/notes/:id — delete a note
export async function onRequestDelete({ params }) {
  const { id } = params;
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
}
