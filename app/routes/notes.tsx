import { useState, useEffect, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { PlusCircle, Trash2, Edit3, Save, X, FileText, Loader2 } from "lucide-react";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  // Load notes list
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

  // Select and load a note
  const handleSelectNote = async (id: string) => {
    setIsEditing(false);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to load note");
      const note: Note = await res.json();
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
    } catch {
      setError("Could not load the selected note.");
    }
  };

  // Start creating a new note
  const handleNewNote = () => {
    setSelectedNote(null);
    setEditTitle("");
    setEditContent("");
    setIsEditing(true);
    setIsCreating(true);
    setError(null);
  };

  // Start editing current note
  const handleEditNote = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    if (isCreating) {
      setSelectedNote(null);
    }
  };

  // Save note (create or update)
  const handleSave = async () => {
    if (!editTitle.trim()) {
      setError("Title cannot be empty.");
      return;
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
        if (!res.ok) throw new Error("Failed to create note");
        const newNote: Note = await res.json();
        setSelectedNote(newNote);
        setIsEditing(false);
        setIsCreating(false);
        await loadNotes();
      } else if (selectedNote) {
        const res = await fetch(`${API_BASE}/${selectedNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle, content: editContent }),
        });
        if (!res.ok) throw new Error("Failed to update note");
        const updated: Note = await res.json();
        setSelectedNote(updated);
        setIsEditing(false);
        await loadNotes();
      }
    } catch {
      setError("Could not save the note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!selectedNote) return;
    if (!window.confirm(`Delete "${selectedNote.title}"?`)) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${selectedNote.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      setSelectedNote(null);
      setIsEditing(false);
      setIsCreating(false);
      await loadNotes();
    } catch {
      setError("Could not delete the note. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

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
            {/* Editor toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
              <span className="text-sm font-medium text-gray-600">
                {isCreating ? "New Note" : "Editing"}
              </span>
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
                  disabled={isSaving}
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
            <div className="flex-1 px-6 pb-6 overflow-hidden">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Start writing your note…"
                className="w-full h-full text-gray-700 bg-transparent border-none outline-none resize-none placeholder-gray-300 text-base leading-relaxed"
              />
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
