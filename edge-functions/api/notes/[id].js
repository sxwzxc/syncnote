import {
  jsonResponse,
  handleOptions,
  requireStorage,
  errorResponse,
  MAX_NOTE_BYTES,
  updateIndex,
  removeFromIndex,
  getStorageParam,
  getAdapter,
} from '../../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

export async function onRequestGet({ request, params }) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;

  const { id } = params;
  try {
    const adapter = getAdapter(backend);
    const note = await adapter.getJSON(`note_${id}`);
    if (!note) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }
    return jsonResponse(note);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPut({ request, params }) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;

  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  try {
    const adapter = getAdapter(backend);
    const existing = await adapter.getJSON(`note_${id}`);
    if (!existing) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

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
      return jsonResponse({ error: 'Note size exceeds the 25 MB storage limit.' }, 413);
    }

    await adapter.putJSON(`note_${id}`, updated);
    await updateIndex(adapter, id, title, now);

    return jsonResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete({ request, params }) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;

  const { id } = params;
  try {
    const adapter = getAdapter(backend);
    const existing = await adapter.getJSON(`note_${id}`);
    if (!existing) {
      return jsonResponse({ error: 'Note not found' }, 404);
    }

    await adapter.delete(`note_${id}`);
    await removeFromIndex(adapter, id);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
