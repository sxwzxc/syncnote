import { jsonResponse, handleOptions, requireKV, errorResponse, MAX_NOTE_BYTES, updateIndex } from '../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet() {
  const kvError = requireKV();
  if (kvError) return kvError;

  try {
    const raw = await notesKV.get('notes_index');
    const index = raw ? JSON.parse(raw) : [];
    return jsonResponse(index);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request }) {
  const kvError = requireKV();
  if (kvError) return kvError;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const title = (body.title || '').trim();
  const content = body.content !== undefined ? body.content : '';
  const images = Array.isArray(body.images) ? body.images : [];

  if (!title) {
    return jsonResponse({ error: 'Title is required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const note = { id, title, content, images, createdAt: now, updatedAt: now };

  const noteJson = JSON.stringify(note);
  if (new TextEncoder().encode(noteJson).byteLength > MAX_NOTE_BYTES) {
    return jsonResponse({ error: 'Note size exceeds the 25 MB KV storage limit.' }, 413);
  }

  try {
    await notesKV.put(`note_${id}`, noteJson);
    await updateIndex(id, title, now);
  } catch (err) {
    return errorResponse(err);
  }

  return jsonResponse(note, 201);
}
