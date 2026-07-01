import {
  jsonResponse,
  handleOptions,
  errorResponse,
  getStorageParam,
  getBlobStore,
  BLOB_STORE_NAME,
} from '../_shared.js';

export async function onRequestOptions() {
  return handleOptions();
}

/**
 * POST /api/upload-url?storage=blob
 *
 * Generates a one-shot presigned PUT URL so the browser can upload a file
 * straight to EdgeOne Pages Blob, bypassing the function for the bytes.
 *
 * Body: { name: string, contentType?: string, expireSeconds?: number }
 * Returns: { url, key, expiresAt, store }
 *
 * Only meaningful for blob storage; calling with ?storage=kv returns 400.
 */
export async function onRequestPost({ request }) {
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
