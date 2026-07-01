import type { NoteImage } from "./types";
import { AUTH_STORAGE_KEY, AUTH_MAX_DAYS } from "./types";

export type Lang = "en" | "zh";

export type Translations = {
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
  addFile: string;
  attachments: string;
  deleteFile: string;
  deleteNote: string;
  confirmDelete: (title: string) => string;
  viewFile: string;
  downloadFile: string;
  dragResizeHint: string;
  addFileHint: string;
  storage: string;
  storageKV: string;
  storageBlob: string;
  storageSwitched: (backend: string) => string;
  storageUnavailable: (backend: string) => string;
};

const translations: Record<Lang, Translations> = {
  en: {
    signIn: "Sign In",
    signOut: "Sign out",
    enterPassword: "Enter your password to continue",
    sessionDuration: `Session stays active for up to ${30} days`,
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
    addFile: "Add file",
    attachments: "Attachments",
    deleteFile: "Remove file",
    deleteNote: "Delete note",
    confirmDelete: (title: string) => `Delete "${title}"?`,
    viewFile: "View full size",
    downloadFile: "Download",
    dragResizeHint: "Drag to resize",
    addFileHint: "Click + to add files · drag & drop · Ctrl+V to paste",
    storage: "Storage",
    storageKV: "KV",
    storageBlob: "Blob",
    storageSwitched: (backend: string) => `Switched to ${backend.toUpperCase()} storage`,
    storageUnavailable: (backend: string) => `${backend.toUpperCase()} storage is unavailable, reverted to previous.`,
  },
  zh: {
    signIn: "登录",
    signOut: "退出登录",
    enterPassword: "输入密码以继续",
    sessionDuration: `登录状态保持 ${30} 天`,
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
    addFile: "添加文件",
    attachments: "附件",
    deleteFile: "删除文件",
    deleteNote: "删除笔记",
    confirmDelete: (title: string) => `确定删除"${title}"？`,
    viewFile: "查看大图",
    downloadFile: "下载",
    dragResizeHint: "拖动调整大小",
    addFileHint: "点击 + 添加文件，或拖拽 / Ctrl+V 粘贴",
    storage: "存储",
    storageKV: "KV",
    storageBlob: "Blob",
    storageSwitched: (backend: string) => `已切换到 ${backend.toUpperCase()} 存储`,
    storageUnavailable: (backend: string) => `${backend.toUpperCase()} 存储不可用，已回退到原存储。`,
  },
};

export function getTranslations(lang: Lang): Translations {
  return translations[lang];
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isImageAttachment(file: NoteImage): boolean {
  if (file.type) return file.type.startsWith("image/");
  return file.data.startsWith("data:image/");
}

export function getAttachmentBadge(file: NoteImage): string {
  const ext = file.name?.split(".").pop()?.trim().toUpperCase();
  if (ext && ext.length <= 5) return ext;
  if (file.type === "application/pdf") return "PDF";
  if (file.type.startsWith("text/")) return "TXT";
  if (file.type.startsWith("audio/")) return "AUDIO";
  if (file.type.startsWith("video/")) return "VIDEO";
  if (file.type.includes("zip") || file.type.includes("compressed") || file.type.includes("tar")) return "ZIP";
  return "FILE";
}

export function isAuthValid(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return false;
    const { expiresAt } = JSON.parse(raw);
    return Date.now() < expiresAt;
  } catch {
    return false;
  }
}

export function saveAuth() {
  const expiresAt = Date.now() + AUTH_MAX_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ expiresAt }));
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function imagesChanged(prev: NoteImage[] | undefined, next: NoteImage[]): boolean {
  if (!prev) return next.length > 0;
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].id !== next[i].id) return true;
  }
  return false;
}
