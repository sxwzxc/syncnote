import {
  jsonResponse,
  handleOptions,
  requireStorage,
  requireKV,
  errorResponse,
  MAX_NOTE_BYTES,
  BLOB_STORE_NAME,
  getStorageParam,
  getAdapter,
  getBlobStore,
  updateIndex,
  removeFromIndex,
} from './edge-functions/api/_shared.js';

/**
 * EdgeOne Pages middleware.
 *
 * Runs BEFORE the SSR handler (the @edgeone/react-router server), so we use
 * it to intercept every /api/* request and handle it directly. This is
 * necessary because the adapter generates meta.json with conf.ssr404=true,
 * which makes the SSR handler catch ALL unmatched paths (including /api/*)
 * and return a React Router 404 before the edge functions in
 * edge-functions/api/ can run.
 *
 * For non-API paths we just call context.next() to hand off to the SSR
 * handler as usual.
 */

export function middleware(context) {
  const url = new URL(context.request.url);
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }
  return routeApi(context);
}

export const config = {
  matcher: [
    '/',
    '/notes',
    '/api/(.*)',
  ],
};

// ---------------------------------------------------------------------------
// API router
// ---------------------------------------------------------------------------

async function routeApi(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // CORS preflight for every /api/* path
  if (method === 'OPTIONS') {
    return handleOptions();
  }

  const path = url.pathname.replace(/^\/api\/?/, ''); // strip "/api/" prefix

  // Route table
  if (path === 'auth') {
    return handleAuth(request, env);
  }
  if (path === 'storage') {
    return handleStorage(request);
  }
  if (path === 'upload-url') {
    return handleUploadUrl(request);
  }
  if (path === 'notes' || path === 'notes/') {
    if (method === 'GET') return handleListNotes(request);
    if (method === 'POST') return handleCreateNote(request);
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  // /api/notes/:id
  const noteMatch = path.match(/^notes\/([^/]+)$/);
  if (noteMatch) {
    const id = decodeURIComponent(noteMatch[1]);
    if (method === 'GET') return handleGetNote(request, id);
    if (method === 'PUT') return handleUpdateNote(request, id);
    if (method === 'DELETE') return handleDeleteNote(request, id);
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

// ---------------------------------------------------------------------------
// Handlers (logic mirrors edge-functions/api/*.js)
// ---------------------------------------------------------------------------

async function handleAuth(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }
  const { password } = body;
  const expectedPassword = env.password;
  if (!expectedPassword) {
    return jsonResponse({ ok: true });
  }
  if (!password || password !== expectedPassword) {
    return jsonResponse({ error: 'Incorrect password' }, 401);
  }
  return jsonResponse({ ok: true });
}

async function handleStorage(request) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) {
    const body = await storageError.json();
    return jsonResponse({ backend, available: false, error: body.error });
  }
  try {
    const adapter = getAdapter(backend);
    await adapter.getJSON('notes_index');
    return jsonResponse({ backend, available: true });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    return jsonResponse({ backend, available: false, error: message });
  }
}

async function handleUploadUrl(request) {
  const backend = getStorageParam(request);
  if (backend !== 'blob') {
    return jsonResponse(
      { error: 'Presigned upload URLs are only available for blob storage. Pass ?storage=blob.' },
      400,
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }
  const name = (body?.name || '').trim();
  if (!name) {
    return jsonResponse({ error: 'name is required' }, 400);
  }
  const expireSeconds = Number(body.expireSeconds) > 0 ? Number(body.expireSeconds) : 3600;
  const contentType = body.contentType && typeof body.contentType === 'string' ? body.contentType : undefined;
  try {
    const store = await getBlobStore();
    const key = `uploads/${crypto.randomUUID()}/${name}`;
    const result = await store.createUploadUrl(key, { expireSeconds, contentType });
    return jsonResponse({ ...result, store: BLOB_STORE_NAME });
  } catch (err) {
    return errorResponse(err);
  }
}

async function handleListNotes(request) {
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

async function handleCreateNote(request) {
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

async function handleGetNote(request, id) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;
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

async function handleUpdateNote(request, id) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;

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

async function handleDeleteNote(request, id) {
  const backend = getStorageParam(request);
  const storageError = requireStorage(backend);
  if (storageError) return storageError;
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
