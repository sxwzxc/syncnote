export interface NoteImage {
  id: string;
  name: string;
  data: string;
  type: string;
}

export interface NoteIndex {
  id: string;
  title: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  images?: NoteImage[];
  createdAt: string;
  updatedAt: string;
}

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export type StorageType = "kv" | "blob";

export const API_BASE = "/api/notes";
export const STORAGE_API = "/api/storage";
export const UPLOAD_URL_API = "/api/upload-url";
export const AUTH_API = "/api/auth";
export const POLL_INTERVAL_MS = 600;
export const POLL_INTERVAL_WS_MS = 5000;
export const AUTO_SAVE_DELAY_MS = 400;
export const MAX_NOTE_BYTES = 25 * 1024 * 1024;
export const AUTH_STORAGE_KEY = "syncnote_auth";
export const LANG_STORAGE_KEY = "syncnote_lang";
export const THEME_STORAGE_KEY = "syncnote_theme";
export const STORAGE_STORAGE_KEY = "syncnote_storage";
export const AUTH_MAX_DAYS = 30;
export const WS_HEARTBEAT_MS = 3000;
export const WS_RECONNECT_BASE_MS = 1000;
export const WS_RECONNECT_MAX_MS = 10000;

/**
 * Build a notes API URL scoped to the given storage backend.
 * /api/notes            -> /api/notes?storage=<storage>
 * /api/notes/:id        -> /api/notes/:id?storage=<storage>
 */
export function notesApiUrl(storage: StorageType, id?: string): string {
  const base = id ? `${API_BASE}/${id}` : API_BASE;
  return `${base}?storage=${storage}`;
}

/** Build a generic API URL scoped to a storage backend. */
export function storageApiUrl(base: string, storage: StorageType): string {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}storage=${storage}`;
}
