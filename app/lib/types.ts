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

export const API_BASE = "/api/notes";
export const AUTH_API = "/api/auth";
export const POLL_INTERVAL_MS = 600;
export const POLL_INTERVAL_WS_MS = 5000;
export const AUTO_SAVE_DELAY_MS = 400;
export const MAX_NOTE_BYTES = 25 * 1024 * 1024;
export const AUTH_STORAGE_KEY = "syncnote_auth";
export const LANG_STORAGE_KEY = "syncnote_lang";
export const THEME_STORAGE_KEY = "syncnote_theme";
export const AUTH_MAX_DAYS = 30;
export const WS_HEARTBEAT_MS = 3000;
export const WS_RECONNECT_BASE_MS = 1000;
export const WS_RECONNECT_MAX_MS = 10000;
