import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { PlusCircle, Trash2, Edit3, Save, X, FileText, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

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
const POLL_INTERVAL_MS = 5000;   // poll every 5 seconds
const AUTO_SAVE_DELAY_MS = 2000; // debounce auto-save by 2 seconds
const MAX_NOTE_BYTES = 25 * 1024 * 1024; // EdgeOne KV limit: 25 MB

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

export default function NotesPage() {
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

  // Refs for stable access inside timers / intervals (avoid stale closures)
  const selectedNoteRef = useRef<Note | null>(null);
  const isEditingRef = useRef(false);
  const isCreatingRef = useRef(false);
  const editTitleRef = useRef("");
  const editContentRef = useRef("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ title: string; content: string } | null>(null);
  const autoSaveStatusRef = useRef<AutoSaveStatus>("idle");

  // Keep refs in sync
  useEffect(() => { selectedNoteRef.current = selectedNote; }, [selectedNote]);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  useEffect(() => { isCreatingRef.current = isCreating; }, [isCreating]);
  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editContentRef.current = editContent; }, [editContent]);
  useEffect(() => { autoSaveStatusRef.current = autoSaveStatus; }, [autoSaveStatus]);

  // ── Content size ──────────────────────────────────────────────────────────
  const noteSizeBytes = useMemo(() => {
    // Model the full note object that will actually be stored in KV
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

  // ── Load notes list ───────────────────────────────────────────────────────
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

  // ── Auto-save (debounced) ─────────────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    const note = selectedNoteRef.current;
    const title = editTitleRef.current;
    const content = editContentRef.current;

    if (!note || isCreatingRef.current) return;
    if (!title.trim()) return;

    // Nothing changed since last save
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

  // Trigger auto-save debounce on content change while editing an existing note
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

  // ── Polling for real-time sync ────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) return;
        const data: NoteIndex[] = await res.json();

        // Always refresh the sidebar list
        setNotesList(data);

        const currentNote = selectedNoteRef.current;
        const currentlyEditing = isEditingRef.current;

        if (!currentNote) return;

        const remoteEntry = data.find((n) => n.id === currentNote.id);
        if (!remoteEntry) return;

        const remotelyUpdated = remoteEntry.updatedAt !== currentNote.updatedAt;

        if (!remotelyUpdated) return;

        if (currentlyEditing) {
          // Don't overwrite in-progress edits — show a conflict warning instead
          setEditConflict(true);
        } else {
          // Silently reload the note content
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
  }, []); // intentionally empty — uses refs for mutable state

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSelectNote = async (id: string) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    setIsEditing(false);
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
  };

  const handleEditNote = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    lastSavedRef.current = { title: selectedNote.title, content: selectedNote.content };
    setIsEditing(true);
    setIsCreating(false);
    setAutoSaveStatus("idle");
    setEditConflict(false);
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
        setIsEditing(false);
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
        setIsEditing(false);
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
      await loadNotes();
    } catch {
      setError("Could not delete the note. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Size indicator helpers ────────────────────────────────────────────────
  const sizeColor = isOverLimit
    ? "text-red-600"
    : isNearLimit
    ? "text-orange-500"
    : noteSizeBytes > MAX_NOTE_BYTES * 0.7
    ? "text-yellow-600"
    : "text-gray-400";

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="font-semibold text-gray-800 text-lg">SyncNote</span>
          </div>
          <Button
            size="sm"
            onClick={handleNewNote}
            className="bg-primary hover:bg-primary-dark text-white cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto py-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : notesList.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No notes yet. Create your first note!
            </div>
          ) : (
            notesList.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSelectNote(n.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-colors",
                  selectedNote?.id === n.id && "bg-white border-l-2 border-l-primary"
                )}
              >
                <p className="font-medium text-gray-800 truncate text-sm">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.updatedAt)}</p>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isEditing ? (
          /* Editor */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Conflict warning */}
            {editConflict && (
              <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center justify-between">
                <span className="text-yellow-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  This note was updated from another device. Saving will overwrite those changes.
                </span>
                <button onClick={() => setEditConflict(false)} className="text-yellow-500 hover:text-yellow-700 ml-4">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {isCreating ? "New Note" : "Editing"}
                </span>
                {/* Auto-save status */}
                {!isCreating && (
                  <span className="text-xs flex items-center gap-1">
                    {autoSaveStatus === "pending" && (
                      <span className="text-gray-400">Unsaved changes</span>
                    )}
                    {autoSaveStatus === "saving" && (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                        <span className="text-gray-400">Auto-saving…</span>
                      </>
                    )}
                    {autoSaveStatus === "saved" && (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-green-600">Saved</span>
                      </>
                    )}
                    {autoSaveStatus === "error" && (
                      <span className="text-red-500">Auto-save failed</span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="cursor-pointer"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || isOverLimit}
                  className="bg-primary hover:bg-primary-dark text-white cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>

            {/* Title input */}
            <div className="px-6 pt-6 pb-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Note title…"
                className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300"
              />
            </div>

            {/* Content textarea */}
            <div className="flex-1 px-6 pb-2 overflow-hidden flex flex-col">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Start writing your note…"
                className="flex-1 w-full text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-300 text-base leading-relaxed"
              />
            </div>

            {/* Size indicator */}
            <div className="px-6 pb-3 flex items-center justify-end gap-1.5">
              {isOverLimit && (
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              )}
              <span className={cn("text-xs", sizeColor)}>
                {formatBytes(noteSizeBytes)} / 25 MB
              </span>
              {isOverLimit && (
                <span className="text-xs text-red-600">— exceeds storage limit</span>
              )}
              {isNearLimit && !isOverLimit && (
                <span className="text-xs text-orange-500">— approaching limit</span>
              )}
            </div>
          </div>
        ) : selectedNote ? (
          /* Note view */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Note toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
              <span className="text-xs text-gray-400">
                Last updated {formatDate(selectedNote.updatedAt)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditNote}
                  className="cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  Delete
                </Button>
              </div>
            </div>

            {/* Note content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedNote.title}</h1>
              <div className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                {selectedNote.content || (
                  <span className="text-gray-300 italic">No content yet. Click Edit to add content.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <FileText className="w-16 h-16 text-gray-200 mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">Select a note to read</h2>
            <p className="text-gray-300 text-sm mb-6">
              Choose a note from the sidebar, or create a new one.
            </p>
            <Button
              onClick={handleNewNote}
              className="bg-primary hover:bg-primary-dark text-white cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Create your first note
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
