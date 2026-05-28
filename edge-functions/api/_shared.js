const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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

function handleOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function requireKV() {
  if (typeof notesKV === 'undefined') {
    return jsonResponse(
      { error: 'KV storage binding (notesKV) is not configured. Please bind notesKV in EdgeOne Pages settings.' },
      503,
    );
  }
  return null;
}

function errorResponse(err) {
  const message = err && err.message ? err.message : String(err);
  return jsonResponse({ error: message }, 500);
}

async function updateIndex(noteId, title, updatedAt) {
  const rawIndex = await notesKV.get('notes_index');
  const index = rawIndex ? JSON.parse(rawIndex) : [];
  const idx = index.findIndex((n) => n.id === noteId);
  if (idx !== -1) {
    index[idx] = { id: noteId, title, updatedAt };
  } else {
    index.unshift({ id: noteId, title, updatedAt });
  }
  await notesKV.put('notes_index', JSON.stringify(index));
  return index;
}

async function removeFromIndex(noteId) {
  const rawIndex = await notesKV.get('notes_index');
  const index = rawIndex ? JSON.parse(rawIndex) : [];
  const filtered = index.filter((n) => n.id !== noteId);
  await notesKV.put('notes_index', JSON.stringify(filtered));
  return filtered;
}

export { CORS_HEADERS, MAX_NOTE_BYTES, jsonResponse, handleOptions, requireKV, errorResponse, updateIndex, removeFromIndex };
