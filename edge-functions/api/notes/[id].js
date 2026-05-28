import { jsonResponse, handleOptions, requireKV, errorResponse, MAX_NOTE_BYTES, updateIndex, removeFromIndex } from '../../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ params }) {
  const kvError = requireKV();
  if (kvError) return kvError;

  const { id } = params;
  try {
    const raw = await notesKV.get(`note_${id}`);
    if (!raw) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }
    return jsonResponse(JSON.parse(raw));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPut({ request, params }) {
  const kvError = requireKV();
  if (kvError) return kvError;

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

    if (body.updatedAt && body.updatedAt !== existing.updatedAt) {
      return jsonResponse({ error: 'Conflict: note has been modified by another client. Please refresh and try again.' }, 409);
    }

    const title = (body.title !== undefined ? body.title : existing.title).trim();
    const content = body.content !== undefined ? body.content : existing.content;
    const images = body.images !== undefined ? body.images : (existing.images ?? []);

    if (!title) {
      return jsonResponse({ error: 'Title is required' }, 400);
    }

    const now = new Date().toISOString();
    const updated = { ...existing, title, content, images, updatedAt: now };

    const updatedJson = JSON.stringify(updated);
    if (new TextEncoder().encode(updatedJson).byteLength > MAX_NOTE_BYTES) {
      return jsonResponse({ error: 'Note size exceeds the 25 MB KV storage limit.' }, 413);
    }

    await notesKV.put(`note_${id}`, updatedJson);
    await updateIndex(id, title, now);

    return jsonResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete({ params }) {
  const kvError = requireKV();
  if (kvError) return kvError;

  const { id } = params;
  try {
    const raw = await notesKV.get(`note_${id}`);
    if (!raw) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    await notesKV.delete(`note_${id}`);
    await removeFromIndex(id);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
