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
} from "lucide-react";

export function meta() {
  return [
    { title: "SyncNote — Online Notes" },
    { name: "description", content: "Your personal online notes, powered by EdgeOne KV storage." },
  ];
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
  createdAt: string;
  updatedAt: string;
}

const API_BASE = "/api/notes";
const AUTH_API = "/api/auth";
const POLL_INTERVAL_MS = 3000;   // poll every 3 seconds
const AUTO_SAVE_DELAY_MS = 2000; // debounce auto-save by 2 seconds
const MAX_NOTE_BYTES = 25 * 1024 * 1024; // EdgeOne KV limit: 25 MB
const AUTH_STORAGE_KEY = "syncnote_auth";
const AUTH_MAX_DAYS = 30;

type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

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

// ── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
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
        setError(data.error || "Incorrect password. Please try again.");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SyncNote</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your password to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Session stays active for up to {AUTH_MAX_DAYS} days
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Notes App ────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setIsAuthenticated(isAuthValid());
  }, []);

  if (isAuthenticated === null) return null; // hydration guard

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <NotesApp onLogout={() => { clearAuth(); setIsAuthenticated(false); }} />;
}

function NotesApp({ onLogout }: { onLogout: () => void }) {
  const [notesList, setNotesList] = useState<NoteIndex[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [editConflict, setEditConflict] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  const selectedNoteRef = useRef<Note | null>(null);
  const isEditingRef = useRef(false);
  const isCreatingRef = useRef(false);
  const editTitleRef = useRef("");
  const editContentRef = useRef("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ title: string; content: string } | null>(null);
  const autoSaveStatusRef = useRef<AutoSaveStatus>("idle");

  useEffect(() => { selectedNoteRef.current = selectedNote; }, [selectedNote]);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  useEffect(() => { isCreatingRef.current = isCreating; }, [isCreating]);
  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editContentRef.current = editContent; }, [editContent]);
  useEffect(() => { autoSaveStatusRef.current = autoSaveStatus; }, [autoSaveStatus]);

  const noteSizeBytes = useMemo(() => {
    const approxNote = {
      id: selectedNote?.id ?? "00000000-0000-0000-0000-000000000000",
      title: editTitle,
      content: editContent,
      createdAt: selectedNote?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return new TextEncoder().encode(JSON.stringify(approxNote)).byteLength;
  }, [editTitle, editContent, selectedNote]);
  const isOverLimit = noteSizeBytes > MAX_NOTE_BYTES;
  const isNearLimit = !isOverLimit && noteSizeBytes > MAX_NOTE_BYTES * 0.9;

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to load notes");
      const data: NoteIndex[] = await res.json();
      setNotesList(data);
    } catch {
      setError("Could not load notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const doAutoSave = useCallback(async () => {
    const note = selectedNoteRef.current;
    const title = editTitleRef.current;
    const content = editContentRef.current;

    if (!note || isCreatingRef.current) return;
    if (!title.trim()) return;

    if (
      lastSavedRef.current?.title === title &&
      lastSavedRef.current?.content === content
    ) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("saving");
    try {
      const res = await fetch(`${API_BASE}/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Auto-save failed");
      const updated: Note = await res.json();
      setSelectedNote(updated);
      selectedNoteRef.current = updated;
      lastSavedRef.current = { title, content };
      setNotesList((prev) =>
        prev.map((n) =>
          n.id === updated.id
            ? { id: updated.id, title: updated.title, updatedAt: updated.updatedAt }
            : n
        )
      );
      setEditConflict(false);
      setAutoSaveStatus("saved");
      setTimeout(
        () => setAutoSaveStatus((s) => (s === "saved" ? "idle" : s)),
        3000
      );
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
  }, [editTitle, editContent, isOverLimit, doAutoSave]);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) return;
        const data: NoteIndex[] = await res.json();

        setNotesList(data);

        const currentNote = selectedNoteRef.current;
        const currentlyEditing = isEditingRef.current;

        if (!currentNote) return;

        const remoteEntry = data.find((n) => n.id === currentNote.id);
        if (!remoteEntry) return;

        const remotelyUpdated = remoteEntry.updatedAt !== currentNote.updatedAt;
        if (!remotelyUpdated) return;

        if (currentlyEditing) {
          setEditConflict(true);
        } else {
          const noteRes = await fetch(`${API_BASE}/${currentNote.id}`);
          if (noteRes.ok) {
            const updated: Note = await noteRes.json();
            setSelectedNote(updated);
            selectedNoteRef.current = updated;
          }
        }
      } catch {
        // Ignore transient polling errors
      }
    };

    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const handleSelectNote = async (id: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsCreating(false);
    setAutoSaveStatus("idle");
    setEditConflict(false);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load note");
      const note: Note = await res.json();
      setSelectedNote(note);
      selectedNoteRef.current = note;
      setEditTitle(note.title);
      setEditContent(note.content);
      lastSavedRef.current = { title: note.title, content: note.content };
      // Default to edit mode
      setIsEditing(true);
      setMobileShowEditor(true);
    } catch {
      setError("Could not load the selected note.");
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
    setIsEditing(true);
    setIsCreating(true);
    setAutoSaveStatus("idle");
    setEditConflict(false);
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
    setEditConflict(false);
    setIsEditing(false);
    setIsCreating(false);
    if (isCreating) {
      setSelectedNote(null);
      selectedNoteRef.current = null;
      setMobileShowEditor(false);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    if (isOverLimit) {
      setError("Note size exceeds the 25 MB KV storage limit. Please reduce the content.");
      return;
    }
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
          body: JSON.stringify({ title: editTitle, content: editContent }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Failed to create note");
        }
        const newNote: Note = await res.json();
        setSelectedNote(newNote);
        selectedNoteRef.current = newNote;
        lastSavedRef.current = { title: editTitle, content: editContent };
        setIsEditing(true);
        setIsCreating(false);
        setAutoSaveStatus("idle");
        await loadNotes();
      } else if (selectedNote) {
        const res = await fetch(`${API_BASE}/${selectedNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle, content: editContent }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Failed to update note");
        }
        const updated: Note = await res.json();
        setSelectedNote(updated);
        selectedNoteRef.current = updated;
        lastSavedRef.current = { title: editTitle, content: editContent };
        setEditConflict(false);
        setAutoSaveStatus("idle");
        await loadNotes();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save the note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm(`Delete "${selectedNote.title}"?`)) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${selectedNote.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      setSelectedNote(null);
      selectedNoteRef.current = null;
      setIsEditing(false);
      setIsCreating(false);
      setAutoSaveStatus("idle");
      setEditConflict(false);
      setMobileShowEditor(false);
      await loadNotes();
    } catch {
      setError("Could not delete the note. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const sizeColor = isOverLimit
    ? "text-red-500"
    : isNearLimit
    ? "text-orange-500"
    : noteSizeBytes > MAX_NOTE_BYTES * 0.7
    ? "text-yellow-600"
    : "text-gray-400";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-gray-50)" }}>
      {/* Sidebar */}
      <aside className={cn(
        "flex-shrink-0 flex flex-col bg-white border-r border-gray-100 shadow-sm",
        "w-full md:w-72",
        mobileShowEditor ? "hidden md:flex" : "flex"
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="font-semibold text-gray-900 text-base">SyncNote</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onLogout}
              title="Sign out"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              onClick={handleNewNote}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer h-8 px-2.5 text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : notesList.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-400 text-sm font-medium">No notes yet</p>
              <p className="text-gray-300 text-xs mt-1">Create your first note!</p>
            </div>
          ) : (
            notesList.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelectNote(n.id)}
                className={cn(
                  "w-full text-left px-4 py-3 mx-0 transition-all rounded-none border-l-2 border-l-transparent",
                  selectedNote?.id === n.id
                    ? "bg-indigo-50 border-l-indigo-500 text-indigo-900"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <p className="font-medium truncate text-sm leading-snug">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.updatedAt)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden bg-white",
        mobileShowEditor ? "flex" : "hidden md:flex"
      )}>
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-2.5 flex items-center justify-between">
            <span className="text-red-600 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-red-500 ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isEditing ? (
          /* Editor */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Conflict warning */}
            {editConflict && (
              <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between">
                <span className="text-amber-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  This note was updated from another device. Saving will overwrite those changes.
                </span>
                <button onClick={() => setEditConflict(false)} className="text-amber-400 hover:text-amber-600 ml-4">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => setMobileShowEditor(false)}
                  className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back to notes list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {isCreating ? "New Note" : "Editing"}
                </span>
                {!isCreating && (
                  <span className="text-xs flex items-center gap-1">
                    {autoSaveStatus === "pending" && (
                      <span className="text-gray-400 hidden md:inline">Unsaved changes</span>
                    )}
                    {autoSaveStatus === "saving" && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        <span className="text-gray-400 hidden md:inline">Saving…</span>
                      </>
                    )}
                    {autoSaveStatus === "saved" && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 hidden md:inline">Saved</span>
                      </>
                    )}
                    {autoSaveStatus === "error" && (
                      <span className="text-red-500 hidden md:inline">Auto-save failed</span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 md:gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="cursor-pointer h-8 px-2 md:px-3 text-xs border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-3.5 h-3.5 md:mr-1" />
                  <span className="hidden md:inline">Cancel</span>
                </Button>
                {selectedNote && !isCreating && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="cursor-pointer h-8 px-2 md:px-3 text-xs border-red-200 text-red-500 hover:bg-red-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 md:mr-1" />
                    )}
                    <span className="hidden md:inline">Delete</span>
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
                  <span className="hidden md:inline">Save</span>
                </Button>
              </div>
            </div>

            {/* Title input */}
            <div className="px-4 md:px-8 pt-4 md:pt-8 pb-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note title…"
                className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
              />
            </div>

            {/* Divider */}
            <div className="mx-4 md:mx-8 border-b border-gray-100" />

            {/* Content textarea */}
            <div className="flex-1 px-4 md:px-8 py-4 overflow-hidden flex flex-col">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Start writing your note…"
                className="flex-1 w-full text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-300 text-sm leading-relaxed"
              />
            </div>

            {/* Size indicator */}
            <div className="px-4 md:px-8 pb-4 flex items-center justify-end gap-1.5">
              {isOverLimit && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              <span className={cn("text-xs", sizeColor)}>
                {formatBytes(noteSizeBytes)} / 25 MB
              </span>
              {isOverLimit && (
                <span className="text-xs text-red-500">— exceeds storage limit</span>
              )}
              {isNearLimit && !isOverLimit && (
                <span className="text-xs text-orange-500">— approaching limit</span>
              )}
            </div>
          </div>
        ) : selectedNote ? (
          /* Note view (read-only) - shouldn't normally appear since we default to editing */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-3 md:px-6 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileShowEditor(false)}
                  className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back to notes list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400">
                  Last updated {formatDate(selectedNote.updatedAt)}
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
                Delete
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedNote.title}</h1>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedNote.content || (
                  <span className="text-gray-300 italic">No content yet.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
              <FileText className="w-10 h-10 text-indigo-200" />
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">No note selected</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              Choose a note from the sidebar, or create a new one to get started.
            </p>
            <button
              onClick={handleNewNote}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Create your first note
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
