import {
  jsonResponse,
  handleOptions,
  requireStorage,
  errorResponse,
  MAX_NOTE_BYTES,
  updateIndex,
  getStorageParam,
  getAdapter,
} from '../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request }) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;

  try {
    const adapter = getAdapter(backend);
    const index = (await adapter.getJSON('notes_index')) ?? [];
    return jsonResponse(index);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request }) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;

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
    return jsonResponse({ error: 'Note size exceeds the 25 MB storage limit.' }, 413);
  }

  try {
    const adapter = getAdapter(backend);
    await adapter.putJSON(`note_${id}`, note);
    await updateIndex(adapter, id, title, now);
  } catch (err) {
    return errorResponse(err);
  }

  return jsonResponse(note, 201);
}
