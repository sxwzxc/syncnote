import { getStore } from "@edgeone/pages-blob";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const MAX_NOTE_BYTES = 25 * 1024 * 1024;

// Blob store namespace used for blob-backed notes. Independent from the KV
// binding (notesKV), so KV and Blob data stay fully separated.
const BLOB_STORE_NAME = "notes";

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

function errorResponse(err) {
  const message = err && err.message ? err.message : String(err);
  return jsonResponse({ error: message }, 500);
}

/**
 * Resolve the requested storage backend from the `?storage=` query parameter.
 * Defaults to "kv" for backwards compatibility.
 */
function getStorageParam(request) {
  try {
    const url = new URL(request.url);
    const value = url.searchParams.get('storage');
    return value === 'blob' ? 'blob' : 'kv';
  } catch {
    return 'kv';
  }
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

function requireBlob() {
  // The blob SDK is bundled with the function. Availability is only known once
  // an operation runs (credentials are fetched lazily). Nothing to check here.
  return null;
}

function requireStorage(backend) {
  return backend === 'blob' ? requireBlob() : requireKV();
}

// ---------------------------------------------------------------------------
// Storage adapters — present a uniform { getJSON, putJSON, delete } interface.
// ---------------------------------------------------------------------------

function kvAdapter() {
  return {
    backend: 'kv',
    async getJSON(key) {
      const raw = await notesKV.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    async putJSON(key, value) {
      await notesKV.put(key, JSON.stringify(value));
    },
    async delete(key) {
      await notesKV.delete(key);
    },
  };
}

// Reuse a single Store instance across requests (it caches STS credentials).
let _blobStore = null;
function getBlobStore() {
  if (!_blobStore) {
    // Strong consistency guarantees read-after-write, which the index
    // read-modify-write and conflict detection rely on.
    _blobStore = getStore({ name: BLOB_STORE_NAME, consistency: 'strong' });
  }
  return _blobStore;
}

function blobAdapter() {
  const store = getBlobStore();
  return {
    backend: 'blob',
    async getJSON(key) {
      return await store.get(key, { type: 'json' });
    },
    async putJSON(key, value) {
      await store.setJSON(key, value);
    },
    async delete(key) {
      await store.delete(key);
    },
  };
}

function getAdapter(backend) {
  return backend === 'blob' ? blobAdapter() : kvAdapter();
}

async function updateIndex(adapter, noteId, title, updatedAt) {
  const index = (await adapter.getJSON('notes_index')) ?? [];
  const idx = index.findIndex((n) => n.id === noteId);
  if (idx !== -1) {
    index[idx] = { id: noteId, title, updatedAt };
  } else {
    index.unshift({ id: noteId, title, updatedAt });
  }
  await adapter.putJSON('notes_index', index);
  return index;
}

async function removeFromIndex(adapter, noteId) {
  const index = (await adapter.getJSON('notes_index')) ?? [];
  const filtered = index.filter((n) => n.id !== noteId);
  await adapter.putJSON('notes_index', filtered);
  return filtered;
}

export {
  CORS_HEADERS,
  MAX_NOTE_BYTES,
  BLOB_STORE_NAME,
  jsonResponse,
  handleOptions,
  requireKV,
  requireBlob,
  requireStorage,
  getStorageParam,
  getAdapter,
  getBlobStore,
  errorResponse,
  updateIndex,
  removeFromIndex,
};
