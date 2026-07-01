import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PlusCircle, FileText, AlertTriangle, X } from "lucide-react";
import { cn } from "~/lib/utils";
import type { Note, NoteIndex, NoteImage, AutoSaveStatus, StorageType } from "~/lib/types";
import { MAX_NOTE_BYTES, notesApiUrl, STORAGE_API, storageApiUrl } from "~/lib/types";
import { getTranslations, isAuthValid, clearAuth, isImageAttachment } from "~/lib/i18n";
import type { Lang, Translations } from "~/lib/i18n";
import { useTheme, useLang, useStorage } from "~/hooks/useThemeLang";
import { useStateRef } from "~/hooks/useStateRef";
import { useAutoSave } from "~/hooks/useAutoSave";
import { useSync } from "~/hooks/useSync";
import { LoginScreen } from "~/components/LoginScreen";
import { NotesSidebar } from "~/components/NotesSidebar";
import { NoteEditor } from "~/components/NoteEditor";
import { NoteViewer } from "~/components/NoteViewer";
import { ContextMenu } from "~/components/ContextMenu";
import { Lightbox } from "~/components/Lightbox";

export function meta() {
  return [
    { title: "SyncNote" },
    { name: "description", content: "Your personal online notes, powered by EdgeOne KV storage." },
  ];
}

export default function NotesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { lang, toggleLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { storage, setStorage } = useStorage();

  useEffect(() => {
    setIsAuthenticated(isAuthValid());
  }, []);

  if (isAuthenticated === null) return null;

  const t = getTranslations(lang);

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
      storage={storage}
      setStorage={setStorage}
      onLogout={() => { clearAuth(); setIsAuthenticated(false); }}
    />
  );
}

interface NotesAppProps {
  onLogout: () => void;
  t: Translations;
  lang: Lang;
  toggleLang: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  storage: StorageType;
  setStorage: (next: StorageType) => void;
}

function NotesApp({ onLogout, t, lang, toggleLang, theme, toggleTheme, storage, setStorage }: NotesAppProps) {
  const [notesList, setNotesList] = useState<NoteIndex[]>([]);
  const [selectedNote, setSelectedNote, selectedNoteRef] = useStateRef<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle, editTitleRef] = useStateRef("");
  const [editContent, setEditContent, editContentRef] = useStateRef("");
  const [editImages, setEditImages, editImagesRef] = useStateRef<NoteImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating, isCreatingRef] = useStateRef(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus, autoSaveStatusRef] = useStateRef<AutoSaveStatus>("idle");
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [remoteSyncStatus, setRemoteSyncStatus] = useState<"idle" | "updated">("idle");
  const [sidebarWidth, setSidebarWidth, sidebarWidthRef] = useStateRef(220);
  const [isDesktop, setIsDesktop] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<NoteImage | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; img: NoteImage; inEditor: boolean } | null>(null);
  const [imagesPanelHeight, setImagesPanelHeight, imagesPanelHeightRef] = useStateRef(112);

  const isEditingRef = useRef(false);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);

  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const storageRef = useRef<StorageType>(storage);
  useEffect(() => { storageRef.current = storage; }, [storage]);

  const hasAutoOpenedLastEditedRef = useRef(false);

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

  const wsRef = useRef<WebSocket | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<{ title: string; content: string; images: NoteImage[] } | null>(null);

  const { wsSubscribedNoteIdRef, tryApplyPendingRemote } = useSync({
    selectedNoteRef,
    isEditingRef,
    isCreatingRef,
    editTitleRef,
    editContentRef,
    editImagesRef,
    autoSaveTimerRef,
    autoSaveStatusRef,
    storageRef,
    lastSavedRef,
    setNotesList,
    setSelectedNote,
    setEditTitle,
    setEditContent,
    setEditImages,
    setAutoSaveStatus,
    setRemoteSyncStatus,
    wsRef,
  });

  const { doAutoSave, scheduleAutoSave, clearAutoSaveTimer } = useAutoSave({
    selectedNoteRef,
    editTitleRef,
    editContentRef,
    editImagesRef,
    isCreatingRef,
    autoSaveStatusRef,
    storageRef,
    isOverLimit,
    setAutoSaveStatus,
    setSelectedNote,
    setNotesList,
    wsRef,
    autoSaveTimerRef,
    lastSavedRef,
    onAfterSave: tryApplyPendingRemote,
  });

  const subscribeNote = useCallback((noteId: string) => {
    wsSubscribedNoteIdRef.current = noteId;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'subscribe', noteId })); } catch {}
    }
  }, [wsSubscribedNoteIdRef]);

  const notifyNoteUpdated = useCallback((noteId: string, updatedAt: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ type: 'note_updated', noteId, updatedAt })); } catch {}
    }
  }, []);

  useEffect(() => {
    if (!isEditing || isCreating || !selectedNote || isOverLimit) return;
    scheduleAutoSave();
    return () => clearAutoSaveTimer();
  }, [editTitle, editContent, editImages, isOverLimit, isEditing, isCreating, selectedNote, scheduleAutoSave, clearAutoSaveTimer]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

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

  useEffect(() => {
    if (!lightboxImg) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxImg(null); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxImg]);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(notesApiUrl(storageRef.current));
      if (!res.ok) throw new Error("failed");
      const data: NoteIndex[] = await res.json();
      setNotesList(data);
    } catch {
      setError(tRef.current.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [storageRef]);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleSelectNote = useCallback(async (id: string) => {
    clearAutoSaveTimer();
    setIsCreating(false);
    isCreatingRef.current = false;
    setAutoSaveStatus("idle");
    setRemoteSyncStatus("idle");
    setError(null);
    try {
      const res = await fetch(notesApiUrl(storageRef.current, id));
      if (!res.ok) throw new Error("failed");
      const note: Note = await res.json();
      setSelectedNote(note);
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
      subscribeNote(note.id);
    } catch {
      setError(tRef.current.loadNoteError);
    }
  }, [clearAutoSaveTimer, storageRef, setAutoSaveStatus, setSelectedNote, setEditTitle, setEditContent, setEditImages, lastSavedRef, subscribeNote]);

  useEffect(() => {
    if (hasAutoOpenedLastEditedRef.current) return;
    if (isLoading) return;
    if (isEditing || selectedNote) {
      hasAutoOpenedLastEditedRef.current = true;
      return;
    }
    if (notesList.length === 0) {
      hasAutoOpenedLastEditedRef.current = true;
      return;
    }
    const lastEdited = notesList.reduce<NoteIndex>((latest: NoteIndex, current: NoteIndex) =>
      current.updatedAt > latest.updatedAt ? current : latest,
      notesList[0]
    );
    hasAutoOpenedLastEditedRef.current = true;
    void handleSelectNote(lastEdited.id);
  }, [isLoading, notesList, isEditing, selectedNote, handleSelectNote]);

  const handleNewNote = useCallback(() => {
    clearAutoSaveTimer();
    setSelectedNote(null);
    setEditTitle("");
    setEditContent("");
    setEditImages([]);
    setIsEditing(true);
    setIsCreating(true);
    isCreatingRef.current = true;
    setAutoSaveStatus("idle");
    setRemoteSyncStatus("idle");
    setError(null);
    lastSavedRef.current = null;
    setMobileShowEditor(true);
  }, [clearAutoSaveTimer, setSelectedNote, setEditTitle, setEditContent, setEditImages, setAutoSaveStatus, lastSavedRef]);

  const handleCancelEdit = useCallback(() => {
    clearAutoSaveTimer();
    setAutoSaveStatus("idle");
    setIsEditing(false);
    setIsCreating(false);
    isCreatingRef.current = false;
    if (isCreating) {
      setSelectedNote(null);
      setEditImages([]);
      setMobileShowEditor(false);
    } else if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditImages(selectedNote.images ?? []);
    }
  }, [clearAutoSaveTimer, setAutoSaveStatus, setSelectedNote, setEditTitle, setEditContent, setEditImages, isCreating, selectedNote]);

  const handleSave = useCallback(async () => {
    if (!editTitleRef.current.trim()) { setError(tRef.current.titleEmpty); return; }
    if (isOverLimit) { setError(tRef.current.sizeExceeds); return; }
    clearAutoSaveTimer();
    setIsSaving(true);
    setError(null);
    try {
      if (isCreatingRef.current) {
        const res = await fetch(notesApiUrl(storageRef.current), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitleRef.current, content: editContentRef.current, images: editImagesRef.current }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || tRef.current.saveError);
        }
        const newNote: Note = await res.json();
        setSelectedNote(newNote);
        lastSavedRef.current = { title: editTitleRef.current, content: editContentRef.current, images: editImagesRef.current };
        setIsEditing(true);
        setIsCreating(false);
        isCreatingRef.current = false;
        setAutoSaveStatus("idle");
        await loadNotes();
      } else if (selectedNoteRef.current) {
        const res = await fetch(notesApiUrl(storageRef.current, selectedNoteRef.current.id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitleRef.current, content: editContentRef.current, images: editImagesRef.current }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || tRef.current.saveError);
        }
        const updated: Note = await res.json();
        setSelectedNote(updated);
        lastSavedRef.current = { title: editTitleRef.current, content: editContentRef.current, images: editImagesRef.current };
        setAutoSaveStatus("idle");
        await loadNotes();
        notifyNoteUpdated(updated.id, updated.updatedAt);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tRef.current.saveError);
    } finally {
      setIsSaving(false);
    }
  }, [clearAutoSaveTimer, storageRef, setAutoSaveStatus, setSelectedNote, isOverLimit, loadNotes, notifyNoteUpdated]);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isEditingRef.current) {
          e.preventDefault();
          handleSaveRef.current();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!selectedNote) return;
    if (!window.confirm(t.confirmDelete(selectedNote.title))) return;
    clearAutoSaveTimer();
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(notesApiUrl(storageRef.current, selectedNote.id), { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setSelectedNote(null);
      setIsEditing(false);
      setIsCreating(false);
      isCreatingRef.current = false;
      setEditImages([]);
      setAutoSaveStatus("idle");
      setMobileShowEditor(false);
      await loadNotes();
    } catch {
      setError(t.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedNote, storageRef, t, clearAutoSaveTimer, setSelectedNote, setEditImages, setAutoSaveStatus, loadNotes]);

  const handleStorageChange = useCallback(async (next: StorageType) => {
    if (next === storageRef.current) return;
    clearAutoSaveTimer();
    setError(null);
    // Probe the target backend before committing to the switch.
    try {
      const res = await fetch(storageApiUrl(STORAGE_API, next));
      const data: { available?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!data.available) {
        setError(tRef.current.storageUnavailable(next));
        return;
      }
    } catch {
      setError(tRef.current.storageUnavailable(next));
      return;
    }
    setStorage(next);
    storageRef.current = next;
    // Reset the editor/list state for the new, independent dataset.
    setSelectedNote(null);
    setIsEditing(false);
    setIsCreating(false);
    isCreatingRef.current = false;
    setEditTitle("");
    setEditContent("");
    setEditImages([]);
    setAutoSaveStatus("idle");
    setRemoteSyncStatus("idle");
    setMobileShowEditor(false);
    lastSavedRef.current = null;
    hasAutoOpenedLastEditedRef.current = false;
    setNotesList([]);
    await loadNotes();
  }, [clearAutoSaveTimer, setStorage, setSelectedNote, setEditTitle, setEditContent, setEditImages, setAutoSaveStatus, loadNotes]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setEditImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: file.name || "file", data, type: file.type },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, [setEditImages]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!isEditingRef.current) return;
      const files = Array.from(e.clipboardData.files);
      if (files.length === 0) return;
      e.preventDefault();
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isEditingRef.current) return;
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidthRef.current;
    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(160, Math.min(480, startWidth + ev.clientX - startX));
      setSidebarWidth(newWidth);
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
  }, [setSidebarWidth, sidebarWidthRef]);

  const handleImagesPanelResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = imagesPanelHeightRef.current;
    const onMouseMove = (ev: MouseEvent) => {
      const newH = Math.max(72, Math.min(360, startH - (ev.clientY - startY)));
      setImagesPanelHeight(newH);
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
  }, [setImagesPanelHeight, imagesPanelHeightRef]);

  const downloadImage = useCallback((img: NoteImage) => {
    const a = document.createElement("a");
    a.href = img.data;
    a.download = img.name || "image";
    a.click();
  }, []);

  const handleImageDoubleClick = useCallback((img: NoteImage) => {
    if (isImageAttachment(img)) {
      setLightboxImg(img);
      return;
    }
    downloadImage(img);
  }, [downloadImage]);

  const handleImageContextMenu = useCallback((e: React.MouseEvent, img: NoteImage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, img, inEditor: isEditing });
  }, [isEditing]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950"
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <NotesSidebar
        notesList={notesList}
        selectedNoteId={selectedNote?.id ?? null}
        isLoading={isLoading}
        sidebarWidth={sidebarWidth}
        isDesktop={isDesktop}
        mobileShowEditor={mobileShowEditor}
        t={t}
        lang={lang}
        theme={theme}
        storage={storage}
        toggleLang={toggleLang}
        toggleTheme={toggleTheme}
        onStorageChange={handleStorageChange}
        onLogout={onLogout}
        onNewNote={handleNewNote}
        onSelectNote={handleSelectNote}
        onResizeMouseDown={handleResizeMouseDown}
      />

      <main className={cn(
        "flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900",
        mobileShowEditor ? "flex" : "hidden md:flex"
      )}>
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
          <NoteEditor
            selectedNote={selectedNote}
            isCreating={isCreating}
            editTitle={editTitle}
            editContent={editContent}
            editImages={editImages}
            isSaving={isSaving}
            isDeleting={isDeleting}
            autoSaveStatus={autoSaveStatus}
            remoteSyncStatus={remoteSyncStatus}
            imagesPanelHeight={imagesPanelHeight}
            t={t}
            setEditTitle={setEditTitle}
            setEditContent={setEditContent}
            setEditImages={setEditImages}
            setImagesPanelHeight={setImagesPanelHeight}
            onCancelEdit={handleCancelEdit}
            onSave={handleSave}
            onDelete={handleDelete}
            onBack={() => setMobileShowEditor(false)}
            onAddFiles={handleFiles}
            onImageDoubleClick={handleImageDoubleClick}
            onImageContextMenu={handleImageContextMenu}
            onImagesPanelResizeMouseDown={handleImagesPanelResizeMouseDown}
          />
        ) : selectedNote ? (
          <NoteViewer
            note={selectedNote}
            isDeleting={isDeleting}
            t={t}
            onDelete={handleDelete}
            onBack={() => setMobileShowEditor(false)}
            onImageDoubleClick={handleImageDoubleClick}
            onImageContextMenu={(e, img) => handleImageContextMenu(e, img)}
          />
        ) : (
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

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          img={contextMenu.img}
          inEditor={contextMenu.inEditor}
          t={t}
          onView={(img) => setLightboxImg(img)}
          onDownload={downloadImage}
          onDelete={(img) => setEditImages((prev) => prev.filter((i) => i.id !== img.id))}
          onClose={() => setContextMenu(null)}
        />
      )}

      {lightboxImg && (
        <Lightbox
          img={lightboxImg}
          t={t}
          onDownload={downloadImage}
          onClose={() => setLightboxImg(null)}
        />
      )}
    </div>
  );
}
