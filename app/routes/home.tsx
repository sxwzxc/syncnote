import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  PlusCircle,
  Trash2,
  Save,
  X,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  ImagePlus,
  Sun,
  Moon,
  Languages,
  RefreshCw,
} from "lucide-react";

export function meta() {
  return [
    { title: "SyncNote" },
    { name: "description", content: "Your personal online notes, powered by EdgeOne KV storage." },
  ];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface NoteImage {
  id: string;
  name: string;
  data: string; // base64 data URL
  type: string; // MIME type
}

interface NoteIndex {
  id: string;
  title: string;
  updatedAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  images?: NoteImage[];
  createdAt: string;
  updatedAt: string;
}

type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = "/api/notes";
const AUTH_API = "/api/auth";
const POLL_INTERVAL_MS = 600;   // poll every 0.6 s for near-real-time sync
const AUTO_SAVE_DELAY_MS = 400; // debounce auto-save
const MAX_NOTE_BYTES = 25 * 1024 * 1024;
const AUTH_STORAGE_KEY = "syncnote_auth";
const LANG_STORAGE_KEY = "syncnote_lang";
const THEME_STORAGE_KEY = "syncnote_theme";
const AUTH_MAX_DAYS = 30;
const WS_HEARTBEAT_MS = 3000;
const WS_RECONNECT_BASE_MS = 1000;
const WS_RECONNECT_MAX_MS = 10000;

// ── Translations ──────────────────────────────────────────────────────────────
type Translations = {
  signIn: string;
  signOut: string;
  enterPassword: string;
  sessionDuration: string;
  passwordPlaceholder: string;
  loading: string;
  noNotes: string;
  noNotesHint: string;
  noNoteSelected: string;
  noNoteSelectedHint: string;
  createFirst: string;
  newNote: string;
  newNoteLabel: string;
  editing: string;
  unsavedChanges: string;
  saving: string;
  saved: string;
  autoSaveFailed: string;
  cancel: string;
  delete: string;
  save: string;
  titlePlaceholder: string;
  contentPlaceholder: string;
  lastUpdated: string;
  exceedsLimit: string;
  approachingLimit: string;
  titleEmpty: string;
  sizeExceeds: string;
  loadError: string;
  loadNoteError: string;
  saveError: string;
  deleteError: string;
  connectError: string;
  liveSync: string;
  remoteUpdated: string;
  incorrectPassword: string;
  addImage: string;
  images: string;
  deleteImage: string;
  deleteNote: string;
  confirmDelete: (title: string) => string;
  viewImage: string;
  downloadImage: string;
};

type Lang = "en" | "zh";

const translations: Record<Lang, Translations> = {
  en: {
    signIn: "Sign In",
    signOut: "Sign out",
    enterPassword: "Enter your password to continue",
    sessionDuration: `Session stays active for up to ${AUTH_MAX_DAYS} days`,
    passwordPlaceholder: "Password",
    loading: "Loading…",
    noNotes: "No notes yet",
    noNotesHint: "Create your first note!",
    noNoteSelected: "No note selected",
    noNoteSelectedHint: "Choose a note from the sidebar, or create a new one to get started.",
    createFirst: "Create your first note",
    newNote: "New",
    newNoteLabel: "New Note",
    editing: "Editing",
    unsavedChanges: "Unsaved changes",
    saving: "Saving…",
    saved: "Saved",
    autoSaveFailed: "Auto-save failed",
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    titlePlaceholder: "Note title…",
    contentPlaceholder: "Start writing your note…",
    lastUpdated: "Last updated",
    exceedsLimit: "— exceeds storage limit",
    approachingLimit: "— approaching limit",
    titleEmpty: "Title cannot be empty.",
    sizeExceeds: "Note size exceeds the 25 MB limit. Please reduce content or remove images.",
    loadError: "Could not load notes. Please try again.",
    loadNoteError: "Could not load the selected note.",
    saveError: "Could not save the note. Please try again.",
    deleteError: "Could not delete the note. Please try again.",
    connectError: "Could not connect. Please try again.",
    liveSync: "Live sync",
    remoteUpdated: "Updated from another device",
    incorrectPassword: "Incorrect password. Please try again.",
    addImage: "Add image",
    images: "Images",
    deleteImage: "Remove image",
    deleteNote: "Delete note",
    confirmDelete: (title: string) => `Delete "${title}"?`,
    viewImage: "View full size",
    downloadImage: "Download",
  },
  zh: {
    signIn: "登录",
    signOut: "退出登录",
    enterPassword: "输入密码以继续",
    sessionDuration: `登录状态保持 ${AUTH_MAX_DAYS} 天`,
    passwordPlaceholder: "密码",
    loading: "加载中…",
    noNotes: "暂无笔记",
    noNotesHint: "创建你的第一篇笔记！",
    noNoteSelected: "未选择笔记",
    noNoteSelectedHint: "从侧栏选择笔记，或新建一篇。",
    createFirst: "创建第一篇笔记",
    newNote: "新建",
    newNoteLabel: "新建笔记",
    editing: "编辑中",
    unsavedChanges: "未保存",
    saving: "保存中…",
    saved: "已保存",
    autoSaveFailed: "自动保存失败",
    cancel: "取消",
    delete: "删除",
    save: "保存",
    titlePlaceholder: "笔记标题…",
    contentPlaceholder: "开始写笔记…",
    lastUpdated: "最后更新",
    exceedsLimit: "— 超出存储限制",
    approachingLimit: "— 接近限制",
    titleEmpty: "标题不能为空。",
    sizeExceeds: "笔记大小超出 25 MB 限制，请减少内容或删除图片。",
    loadError: "无法加载笔记，请重试。",
    loadNoteError: "无法加载所选笔记。",
    saveError: "无法保存笔记，请重试。",
    deleteError: "无法删除笔记，请重试。",
    connectError: "无法连接，请重试。",
    liveSync: "实时同步",
    remoteUpdated: "已同步其他设备的更改",
    incorrectPassword: "密码错误，请重试。",
    addImage: "添加图片",
    images: "图片",
    deleteImage: "删除图片",
    deleteNote: "删除笔记",
    confirmDelete: (title: string) => `确定删除"${title}"？`,
    viewImage: "查看大图",
    downloadImage: "下载图片",
  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isAuthValid(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

function saveAuth() {
  const expiresAt = Date.now() + AUTH_MAX_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ expiresAt }));
}

function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

// ── Login Screen ──────────────────────────────────────────────────────────────
interface LoginScreenProps {
  onSuccess: () => void;
  t: Translations;
  lang: Lang;
  toggleLang: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

function LoginScreen({ onSuccess, t, lang, toggleLang, theme, toggleTheme }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(AUTH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        saveAuth();
        onSuccess();
      } else {
        setError(data.error || t.incorrectPassword);
      }
    } catch {
      setError(t.connectError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      {/* Top-right toggles */}
      <div className="fixed top-4 right-4 flex items-center gap-1">
        <button
          onClick={toggleLang}
          title={lang === "en" ? "切换中文" : "Switch to English"}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
        >
          {lang === "en" ? "中" : "EN"}
        </button>
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Dark mode" : "Light mode"}
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">SyncNote</h1>
            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t.enterPassword}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                autoFocus
                className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-slate-100 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.signIn}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">
            {t.sessionDuration}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Root Gate: handles auth + lang/theme ─────────────────────────────────────
export default function NotesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setIsAuthenticated(isAuthValid());
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
    if (savedLang === "en" || savedLang === "zh") setLang(savedLang);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem(THEME_STORAGE_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "zh" : "en";
      localStorage.setItem(LANG_STORAGE_KEY, next);
      return next;
    });
  }, []);

  if (isAuthenticated === null) return null; // hydration guard

  const t = translations[lang];

  if (!isAuthenticated) {
    return (
      <LoginScreen
        t={t}
        lang={lang}
        toggleLang={toggleLang}
        theme={theme}
        toggleTheme={toggleTheme}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <NotesApp
      t={t}
      lang={lang}
      toggleLang={toggleLang}
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={() => { clearAuth(); setIsAuthenticated(false); }}
    />
  );
}

// ── Notes App ─────────────────────────────────────────────────────────────────
interface NotesAppProps {
  onLogout: () => void;
  t: Translations;
  lang: Lang;
  toggleLang: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

function NotesApp({ onLogout, t, lang, toggleLang, theme, toggleTheme }: NotesAppProps) {
  const [notesList, setNotesList] = useState<NoteIndex[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<NoteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [remoteSyncStatus, setRemoteSyncStatus] = useState<"idle" | "updated">("idle");
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isDesktop, setIsDesktop] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<NoteImage | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; img: NoteImage; inEditor: boolean } | null>(null);
  const [imagesPanelHeight, setImagesPanelHeight] = useState(112);

  // Refs to access latest state in async callbacks
  const selectedNoteRef = useRef<Note | null>(null);
  const isEditingRef = useRef(false);
  const isCreatingRef = useRef(false);
  const editTitleRef = useRef("");
  const editContentRef = useRef("");
  const editImagesRef = useRef<NoteImage[]>([]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ title: string; content: string; images: NoteImage[] } | null>(null);
  const autoSaveStatusRef = useRef<AutoSaveStatus>("idle");
  const remoteSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsHeartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsSubscribedNoteIdRef = useRef<string | null>(null);
  const pollFnRef = useRef<(() => void) | null>(null);
  const sidebarWidthRef = useRef(220);
  const imagesPanelHeightRef = useRef(112);

  useEffect(() => { selectedNoteRef.current = selectedNote; }, [selectedNote]);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  useEffect(() => { isCreatingRef.current = isCreating; }, [isCreating]);
  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editContentRef.current = editContent; }, [editContent]);
  useEffect(() => { editImagesRef.current = editImages; }, [editImages]);
  useEffect(() => { autoSaveStatusRef.current = autoSaveStatus; }, [autoSaveStatus]);
  useEffect(() => { sidebarWidthRef.current = sidebarWidth; }, [sidebarWidth]);
  useEffect(() => { imagesPanelHeightRef.current = imagesPanelHeight; }, [imagesPanelHeight]);

  // ── Desktop detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Close context menu on outside click or Escape ────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null); };
    document.addEventListener("click", close);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu]);

  // ── Close lightbox on Escape ─────────────────────────────────────────────────
  useEffect(() => {
    if (!lightboxImg) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImg(null); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxImg]);

  const noteSizeBytes = useMemo(() => {
    const approxNote = {
      id: selectedNote?.id ?? "00000000-0000-0000-0000-000000000000",
      title: editTitle,
      content: editContent,
      images: editImages,
      createdAt: selectedNote?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new TextEncoder().encode(JSON.stringify(approxNote)).byteLength;
  }, [editTitle, editContent, editImages, selectedNote]);

  const isOverLimit = noteSizeBytes > MAX_NOTE_BYTES;
  const isNearLimit = !isOverLimit && noteSizeBytes > MAX_NOTE_BYTES * 0.9;

  // Ref to always have the current translation without adding to useCallback deps
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  // ── Load notes ───────────────────────────────────────────────────────────────
  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("failed");
      const data: NoteIndex[] = await res.json();
      setNotesList(data);
    } catch {
      setError(tRef.current.loadError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // ── Auto-save ────────────────────────────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    autoSaveTimerRef.current = null; // 计时器已触发，清空引用以便轮询正确判断 pending 状态
    const note = selectedNoteRef.current;
    const title = editTitleRef.current;
    const content = editContentRef.current;
    const images = editImagesRef.current;

    if (!note || isCreatingRef.current) return;
    if (!title.trim()) return;

    if (
      lastSavedRef.current?.title === title &&
      lastSavedRef.current?.content === content &&
      JSON.stringify(lastSavedRef.current?.images) === JSON.stringify(images)
    ) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, images }),
      });
      if (!res.ok) throw new Error("auto-save failed");
      const updated: Note = await res.json();
      setSelectedNote(updated);
      selectedNoteRef.current = updated;
      lastSavedRef.current = { title, content, images };
      setNotesList((prev) =>
        prev.map((n) =>
          n.id === updated.id
            ? { id: updated.id, title: updated.title, updatedAt: updated.updatedAt }
            : n
        )
      );
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus((s) => (s === "saved" ? "idle" : s)), 3000);
      // Notify other WebSocket clients that this note was updated
      const _ws = wsRef.current;
      if (_ws && _ws.readyState === WebSocket.OPEN) {
        try { _ws.send(JSON.stringify({ type: 'note_updated', noteId: updated.id, updatedAt: updated.updatedAt })); } catch {}
      }
    } catch {
      setAutoSaveStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!isEditingRef.current || isCreatingRef.current) return;
    if (!selectedNoteRef.current) return;
    if (isOverLimit) return;

    setAutoSaveStatus("pending");
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(doAutoSave, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [editTitle, editContent, editImages, isOverLimit, doAutoSave]);

  // ── Polling — real-time sync with auto conflict resolution ───────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) return;
        const data: NoteIndex[] = await res.json();
        setNotesList(data);

        const currentNote = selectedNoteRef.current;
        if (!currentNote) return;

        const remoteEntry = data.find((n) => n.id === currentNote.id);
        if (!remoteEntry) return;
        if (remoteEntry.updatedAt === currentNote.updatedAt) return;

        // Remote is newer — check if we have pending local changes
        const hasPendingChanges =
          autoSaveTimerRef.current !== null ||
          autoSaveStatusRef.current === "pending" ||
          autoSaveStatusRef.current === "saving";

        // If user is actively editing with unsaved changes, their next save wins
        if (hasPendingChanges) return;

        // No pending changes — silently reload from server
        const noteRes = await fetch(`${API_BASE}/${currentNote.id}`);
        if (!noteRes.ok) return;
        const updated: Note = await noteRes.json();
        setSelectedNote(updated);
        selectedNoteRef.current = updated;

        // Signal remote update to the UI
        if (remoteSyncTimerRef.current) clearTimeout(remoteSyncTimerRef.current);
        setRemoteSyncStatus("updated");
        remoteSyncTimerRef.current = setTimeout(() => setRemoteSyncStatus("idle"), 3000);

        // Also update the edit fields if in editing mode (e.g. viewing on another device made a change)
        if (isEditingRef.current) {
          setEditTitle(updated.title);
          setEditContent(updated.content);
          setEditImages(updated.images ?? []);
          lastSavedRef.current = {
            title: updated.title,
            content: updated.content,
            images: updated.images ?? [],
          };
        }
      } catch {
        // Ignore transient polling errors
      }
    };

    pollFnRef.current = poll;
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
      pollFnRef.current = null;
    };
  }, []);

  // ── WebSocket — push notifications for near-instant cross-device sync ────────
  useEffect(() => {
    if (typeof WebSocket === 'undefined') return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${location.host}/sync`;
    let reconnectDelay = WS_RECONNECT_BASE_MS;
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectDelay = WS_RECONNECT_BASE_MS;
          // Re-subscribe to the current note after reconnect
          const noteId = wsSubscribedNoteIdRef.current;
          if (noteId) ws.send(JSON.stringify({ type: 'subscribe', noteId }));
          // Start keepalive heartbeat
          if (wsHeartbeatTimerRef.current) clearInterval(wsHeartbeatTimerRef.current);
          wsHeartbeatTimerRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
          }, WS_HEARTBEAT_MS);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'note_updated') {
              const currentNote = selectedNoteRef.current;
              if (currentNote && msg.noteId === currentNote.id) {
                // Trigger an immediate sync instead of waiting for the next poll interval
                pollFnRef.current?.();
              }
            }
          } catch {
            // ignore malformed messages
          }
        };

        ws.onclose = () => {
          if (wsHeartbeatTimerRef.current) {
            clearInterval(wsHeartbeatTimerRef.current);
            wsHeartbeatTimerRef.current = null;
          }
          wsRef.current = null;
          if (unmounted) return;
          // Exponential backoff reconnect
          wsReconnectTimerRef.current = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, WS_RECONNECT_MAX_MS);
            connect();
          }, reconnectDelay);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // WebSocket unavailable (local dev without node-functions) — polling handles sync
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (wsReconnectTimerRef.current) clearTimeout(wsReconnectTimerRef.current);
      if (wsHeartbeatTimerRef.current) clearInterval(wsHeartbeatTimerRef.current);
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null; // prevent reconnect attempt during unmount
        ws.close();
        wsRef.current = null;
      }
    };
  }, []);

  // ── Image handlers ───────────────────────────────────────────────────────────
  const handleImageFiles = useCallback((files: FileList | File[]) => {
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const data = ev.target?.result as string;
          setEditImages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), name: file.name || "image", data, type: file.type },
          ]);
        };
        reader.readAsDataURL(file);
      });
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleImageFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleImageFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!isEditingRef.current) return;
      // Check clipboard items first — this captures screenshots and copied images
      const items = Array.from(e.clipboardData.items);
      const imageItems = items.filter((item) => item.type.startsWith("image/"));
      if (imageItems.length > 0) {
        e.preventDefault();
        const files = imageItems.map((item) => item.getAsFile()).filter((f): f is File => f !== null);
        handleImageFiles(files);
        return;
      }
      // Fall back to file list (e.g. dragged-and-pasted files)
      const imageFiles = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length === 0) return;
      e.preventDefault();
      handleImageFiles(imageFiles);
    },
    [handleImageFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isEditingRef.current) return;
      if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files);
    },
    [handleImageFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // ── Sidebar drag-resize ──────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidthRef.current;
    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(480, startWidth + ev.clientX - startX));
      setSidebarWidth(newWidth);
      sidebarWidthRef.current = newWidth;
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  // ── Images panel drag-resize ─────────────────────────────────────────────────
  const handleImagesPanelResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = imagesPanelHeightRef.current;
    const onMouseMove = (ev: MouseEvent) => {
      // dragging up → larger panel; dragging down → smaller panel
      const newH = Math.max(72, Math.min(360, startH - (ev.clientY - startY)));
      setImagesPanelHeight(newH);
      imagesPanelHeightRef.current = newH;
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  // ── Image lightbox & context menu ────────────────────────────────────────────
  const handleImageDoubleClick = useCallback((img: NoteImage) => {
    setLightboxImg(img);
  }, []);

  const handleImageContextMenu = useCallback((e: React.MouseEvent, img: NoteImage, inEditor: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, img, inEditor });
  }, []);

  const downloadImage = useCallback((img: NoteImage) => {
    const a = document.createElement("a");
    a.href = img.data;
    a.download = img.name || "image";
    a.click();
  }, []);

  // ── Note operations ───────────────────────────────────────────────────────────
  const handleSelectNote = async (id: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsCreating(false);
    setAutoSaveStatus("idle");
    setRemoteSyncStatus("idle");
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("failed");
      const note: Note = await res.json();
      setSelectedNote(note);
      selectedNoteRef.current = note;
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditImages(note.images ?? []);
      lastSavedRef.current = {
        title: note.title,
        content: note.content,
        images: note.images ?? [],
      };
      setIsEditing(true);
      setMobileShowEditor(true);
      // Subscribe to real-time updates for this note via WebSocket
      wsSubscribedNoteIdRef.current = note.id;
      const _wsS = wsRef.current;
      if (_wsS && _wsS.readyState === WebSocket.OPEN) {
        try { _wsS.send(JSON.stringify({ type: 'subscribe', noteId: note.id })); } catch {}
      }
    } catch {
      setError(t.loadNoteError);
    }
  };

  const handleNewNote = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setSelectedNote(null);
    selectedNoteRef.current = null;
    setEditTitle("");
    setEditContent("");
    setEditImages([]);
    setIsEditing(true);
    setIsCreating(true);
    setAutoSaveStatus("idle");
    setRemoteSyncStatus("idle");
    setError(null);
    lastSavedRef.current = null;
    setMobileShowEditor(true);
  };

  const handleCancelEdit = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setAutoSaveStatus("idle");
    setIsEditing(false);
    setIsCreating(false);
    if (isCreating) {
      setSelectedNote(null);
      selectedNoteRef.current = null;
      setEditImages([]);
      setMobileShowEditor(false);
    } else if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditImages(selectedNote.images ?? []);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) { setError(t.titleEmpty); return; }
    if (isOverLimit) { setError(t.sizeExceeds); return; }
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (isCreating) {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle, content: editContent, images: editImages }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || t.saveError);
        }
        const newNote: Note = await res.json();
        setSelectedNote(newNote);
        selectedNoteRef.current = newNote;
        lastSavedRef.current = { title: editTitle, content: editContent, images: editImages };
        setIsEditing(true);
        setIsCreating(false);
        setAutoSaveStatus("idle");
        await loadNotes();
      } else if (selectedNote) {
        const res = await fetch(`${API_BASE}/${selectedNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle, content: editContent, images: editImages }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || t.saveError);
        }
        const updated: Note = await res.json();
        setSelectedNote(updated);
        selectedNoteRef.current = updated;
        lastSavedRef.current = { title: editTitle, content: editContent, images: editImages };
        setAutoSaveStatus("idle");
        await loadNotes();
        // Notify other WebSocket clients that this note was updated
        const _wsM = wsRef.current;
        if (_wsM && _wsM.readyState === WebSocket.OPEN) {
          try { _wsM.send(JSON.stringify({ type: 'note_updated', noteId: updated.id, updatedAt: updated.updatedAt })); } catch {}
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm(t.confirmDelete(selectedNote.title))) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${selectedNote.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setSelectedNote(null);
      selectedNoteRef.current = null;
      setIsEditing(false);
      setIsCreating(false);
      setEditImages([]);
      setAutoSaveStatus("idle");
      setMobileShowEditor(false);
      await loadNotes();
    } catch {
      setError(t.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  const sizeColor = isOverLimit
    ? "text-red-500"
    : isNearLimit
    ? "text-orange-500"
    : noteSizeBytes > MAX_NOTE_BYTES * 0.7
    ? "text-yellow-600 dark:text-yellow-500"
    : "text-gray-400 dark:text-slate-500";

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* ── Sidebar ── */}
      <aside className={cn(
        "flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 shadow-sm relative",
        "w-full",
        mobileShowEditor ? "hidden md:flex" : "flex"
      )} style={isDesktop ? { width: sidebarWidth } : undefined}>
        {/* Drag resize handle – desktop only */}
        <div
          className="hidden md:block absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-indigo-300/60 dark:hover:bg-indigo-600/40 transition-colors"
          onMouseDown={handleResizeMouseDown}
          title="Drag to resize"
        />
        {/* Sidebar header */}
        <div className="flex flex-col border-b border-gray-100 dark:border-slate-800">
          {/* 标题行：Logo + 控制按钮 */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">SyncNote</span>
              <span title={t.liveSync} className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {/* Language toggle */}
              <button
                onClick={toggleLang}
                title={lang === "en" ? "切换中文" : "Switch to English"}
                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Languages className="w-4 h-4" />
              </button>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={theme === "light" ? "Dark mode" : "Light mode"}
                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
              {/* Logout */}
              <button
                onClick={onLogout}
                title={t.signOut}
                className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* 新建按钮独占一行，保证完整显示 */}
          <div className="px-3 pb-3">
            <Button
              size="sm"
              onClick={handleNewNote}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer h-8 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              {t.newNote}
            </Button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 dark:text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">{t.loading}</span>
            </div>
          ) : notesList.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-gray-300 dark:text-slate-600" />
              </div>
              <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">{t.noNotes}</p>
              <p className="text-gray-300 dark:text-slate-600 text-xs mt-1">{t.noNotesHint}</p>
            </div>
          ) : (
            notesList.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelectNote(n.id)}
                className={cn(
                  "w-full text-left px-4 py-3 transition-all border-l-2 border-l-transparent",
                  selectedNote?.id === n.id
                    ? "bg-indigo-50 dark:bg-indigo-950/50 border-l-indigo-500 dark:border-l-indigo-400 text-indigo-900 dark:text-indigo-200"
                    : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300"
                )}
              >
                <p className="font-medium truncate text-sm leading-snug">{n.title}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{formatDate(n.updatedAt)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900",
        mobileShowEditor ? "flex" : "hidden md:flex"
      )}>
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-100 dark:border-red-900 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
            <span className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-300 dark:text-red-700 hover:text-red-500 ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isEditing ? (
          /* ── Editor ── */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setMobileShowEditor(false)}
                  className="md:hidden p-1.5 -ml-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  {isCreating ? t.newNoteLabel : t.editing}
                </span>
                {!isCreating && (
                  <span className="text-xs flex items-center gap-1">
                    {autoSaveStatus === "pending" && (
                      <span className="text-gray-400 dark:text-slate-500 hidden md:inline">{t.unsavedChanges}</span>
                    )}
                    {autoSaveStatus === "saving" && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400 dark:text-slate-500" />
                        <span className="text-gray-400 dark:text-slate-500 hidden md:inline">{t.saving}</span>
                      </>
                    )}
                    {autoSaveStatus === "saved" && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 hidden md:inline">{t.saved}</span>
                      </>
                    )}
                    {autoSaveStatus === "error" && (
                      <span className="text-red-500 dark:text-red-400 hidden md:inline">{t.autoSaveFailed}</span>
                    )}
                    {autoSaveStatus === "idle" && remoteSyncStatus === "updated" && (
                      <>
                        <RefreshCw className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400 hidden md:inline">{t.remoteUpdated}</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 md:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="cursor-pointer h-8 px-2 md:px-3 text-xs border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 bg-transparent"
                >
                  <X className="w-3.5 h-3.5 md:mr-1" />
                  <span className="hidden md:inline">{t.cancel}</span>
                </Button>
                {selectedNote && !isCreating && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="cursor-pointer h-8 px-2 md:px-3 text-xs border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 bg-transparent"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 md:mr-1" />
                    )}
                    <span className="hidden md:inline">{t.delete}</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || isOverLimit}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer h-8 px-2 md:px-3 text-xs"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 md:mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 md:mr-1" />
                  )}
                  <span className="hidden md:inline">{t.save}</span>
                </Button>
              </div>
            </div>

            {/* Title */}
            <div className="px-4 md:px-8 pt-4 md:pt-6 pb-2 flex-shrink-0">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                className="w-full text-2xl font-bold text-gray-900 dark:text-slate-100 bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-slate-700"
              />
            </div>
            <div className="mx-4 md:mx-8 border-b border-gray-100 dark:border-slate-800 flex-shrink-0" />

            {/* Scrollable content area — fills all space between divider and images panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Text content */}
              <div className="flex-1 flex flex-col px-4 md:px-8 pt-4 pb-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder={t.contentPlaceholder}
                  className="flex-1 w-full text-gray-700 dark:text-slate-300 bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-slate-700 text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* ── Resizable Images panel ── */}
            <div
              className="flex-shrink-0 border-t border-gray-100 dark:border-slate-800 relative flex flex-col"
              style={{ height: imagesPanelHeight }}
            >
              {/* Drag handle */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-10 hover:bg-indigo-300/50 dark:hover:bg-indigo-600/30 transition-colors"
                onMouseDown={handleImagesPanelResizeMouseDown}
                title={lang === "zh" ? "拖动调整高度" : "Drag to resize"}
              />
              {/* Panel inner */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-3 pb-2">
                <div className="flex flex-wrap gap-2 items-start">
                  {editImages.map((img) => (
                    <div key={img.id} className="relative group w-16 h-16 flex-shrink-0">
                      <img
                        src={img.data}
                        alt={img.name}
                        className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-slate-700 cursor-zoom-in"
                        onDoubleClick={() => handleImageDoubleClick(img)}
                        onContextMenu={(e) => handleImageContextMenu(e, img, true)}
                      />
                      <button
                        type="button"
                        onClick={() => setEditImages((prev) => prev.filter((i) => i.id !== img.id))}
                        title={t.deleteImage}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label
                    title={t.addImage}
                    className="w-16 h-16 flex-shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <ImagePlus className="w-4 h-4 text-gray-300 dark:text-slate-600" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                </div>
                {editImages.length === 0 && (
                  <p className="mt-1 text-xs text-gray-300 dark:text-slate-600">
                    {lang === "zh" ? "点击 + 添加图片，或拖拽 / Ctrl+V 粘贴" : "Click + to add · drag & drop · Ctrl+V to paste"}
                  </p>
                )}
              </div>
            </div>

            {/* Size indicator */}
            <div className="px-4 md:px-8 py-2 flex items-center justify-end gap-1.5 border-t border-gray-100 dark:border-slate-800 flex-shrink-0">
              {isOverLimit && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              <span className={cn("text-xs", sizeColor)}>
                {formatBytes(noteSizeBytes)} / 25 MB
              </span>
              {isOverLimit && (
                <span className="text-xs text-red-500">{t.exceedsLimit}</span>
              )}
              {isNearLimit && !isOverLimit && (
                <span className="text-xs text-orange-500">{t.approachingLimit}</span>
              )}
            </div>
          </div>
        ) : selectedNote ? (
          /* ── Read-only view ── */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileShowEditor(false)}
                  className="md:hidden p-1.5 -ml-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  {t.lastUpdated} {formatDate(selectedNote.updatedAt)}
                </span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="cursor-pointer h-8 px-3 text-xs"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                )}
                {t.delete}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                {selectedNote.title}
              </h1>
              <div className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedNote.content || (
                  <span className="text-gray-300 dark:text-slate-600 italic">No content yet.</span>
                )}
              </div>
              {selectedNote.images && selectedNote.images.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.images.map((img) => (
                      <img
                        key={img.id}
                        src={img.data}
                        alt={img.name}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-slate-700 cursor-zoom-in hover:opacity-90 transition-opacity"
                        onDoubleClick={() => handleImageDoubleClick(img)}
                        onContextMenu={(e) => handleImageContextMenu(e, img, false)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mb-5">
              <FileText className="w-10 h-10 text-indigo-200 dark:text-indigo-800" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">
              {t.noNoteSelected}
            </h2>
            <p className="text-gray-400 dark:text-slate-500 text-sm mb-6 max-w-xs">
              {t.noNoteSelectedHint}
            </p>
            <button
              onClick={handleNewNote}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              {t.createFirst}
            </button>
          </div>
        )}
      </main>

      {/* ── Context Menu ── */}
      {contextMenu && (() => {
        const menuW = 168;
        const menuH = contextMenu.inEditor ? 132 : 96;
        const x = contextMenu.x + menuW > window.innerWidth ? contextMenu.x - menuW : contextMenu.x;
        const y = contextMenu.y + menuH > window.innerHeight ? contextMenu.y - menuH : contextMenu.y;
        return (
          <div
            className="fixed z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl py-1 min-w-[168px]"
            style={{ top: y, left: x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
              onClick={() => { setLightboxImg(contextMenu.img); setContextMenu(null); }}
            >
              <Eye className="w-4 h-4 flex-shrink-0 text-gray-400" />
              {t.viewImage}
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
              onClick={() => { downloadImage(contextMenu.img); setContextMenu(null); }}
            >
              <ImagePlus className="w-4 h-4 flex-shrink-0 text-gray-400" />
              {t.downloadImage}
            </button>
            {contextMenu.inEditor && (
              <>
                <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
                <button
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2"
                  onClick={() => {
                    setEditImages((prev) => prev.filter((i) => i.id !== contextMenu.img.id));
                    setContextMenu(null);
                  }}
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  {t.deleteImage}
                </button>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Lightbox ── */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setLightboxImg(null)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            className="absolute bottom-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
            onClick={(e) => { e.stopPropagation(); downloadImage(lightboxImg); }}
          >
            <ImagePlus className="w-4 h-4" />
            {t.downloadImage}
          </button>
          <img
            src={lightboxImg.data}
            alt={lightboxImg.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxImg.name && (
            <p className="absolute bottom-5 left-5 text-white/60 text-sm truncate max-w-[60vw]">
              {lightboxImg.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
