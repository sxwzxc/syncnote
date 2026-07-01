import {
  jsonResponse,
  handleOptions,
  getStorageParam,
  getAdapter,
  requireStorage,
} from '../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

/**
 * GET /api/storage?storage=kv|blob
 *
 * Reports whether the requested storage backend is available and reachable.
 * Useful for the frontend toggle to detect a missing KV binding or an
 * unconfigured Blob environment.
 */
export async function onRequestGet({ request }) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) {
    // KV binding missing — return structured status rather than a bare 503.
    const body = await storageError.json();
    return jsonResponse({ backend, available: false, error: body.error });
  }

  try {
    const adapter = getAdapter(backend);
    // Touch the index key to confirm the backend actually responds.
    await adapter.getJSON('notes_index');
    return jsonResponse({ backend, available: true });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return jsonResponse({ backend, available: false, error: message });
  }
}
