import { useCallback } from "react";
import type { Note, NoteImage, AutoSaveStatus, StorageType } from "~/lib/types";
import { notesApiUrl, AUTO_SAVE_DELAY_MS } from "~/lib/types";
import { imagesChanged } from "~/lib/i18n";

interface UseAutoSaveOptions {
  selectedNoteRef: React.RefObject<Note | null>;
  editTitleRef: React.RefObject<string>;
  editContentRef: React.RefObject<string>;
  editImagesRef: React.RefObject<NoteImage[]>;
  isCreatingRef: React.RefObject<boolean>;
  autoSaveStatusRef: React.RefObject<AutoSaveStatus>;
  storageRef: React.MutableRefObject<StorageType>;
  isOverLimit: boolean;
  setAutoSaveStatus: (status: AutoSaveStatus) => void;
  setSelectedNote: (note: Note | null) => void;
  setNotesList: React.Dispatch<React.SetStateAction<{ id: string; title: string; updatedAt: string }[]>>;
  wsRef: React.RefObject<WebSocket | null>;
  autoSaveTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  lastSavedRef: React.MutableRefObject<{ title: string; content: string; images: NoteImage[] } | null>;
  onAfterSave?: () => void;
}

export function useAutoSave({
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
  onAfterSave,
}: UseAutoSaveOptions) {
  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [autoSaveTimerRef]);

  const doAutoSave = useCallback(async () => {
    autoSaveTimerRef.current = null;
    const note = selectedNoteRef.current;
    const title = editTitleRef.current;
    const content = editContentRef.current;
    const images = editImagesRef.current;

    if (!note || isCreatingRef.current) return;
    if (!title.trim()) return;

    const saved = lastSavedRef.current;
    if (
      saved?.title === title &&
      saved?.content === content &&
      !imagesChanged(saved?.images, images)
    ) {
      setAutoSaveStatus("idle");
      return;
    }

    setAutoSaveStatus("saving");
    try {
      const res = await fetch(notesApiUrl(storageRef.current, note.id), {
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
      setTimeout(() => {
        autoSaveStatusRef.current = autoSaveStatusRef.current === "saved" ? "idle" : autoSaveStatusRef.current;
        setAutoSaveStatus(autoSaveStatusRef.current);
      }, 3000);
      const _ws = wsRef.current;
      if (_ws && _ws.readyState === WebSocket.OPEN) {
        try { _ws.send(JSON.stringify({ type: 'note_updated', noteId: updated.id, updatedAt: updated.updatedAt })); } catch {}
      }
      onAfterSave?.();
    } catch {
      setAutoSaveStatus("error");
    }
  }, [selectedNoteRef, editTitleRef, editContentRef, editImagesRef, isCreatingRef, autoSaveStatusRef, storageRef, setAutoSaveStatus, setSelectedNote, setNotesList, wsRef, autoSaveTimerRef, lastSavedRef, onAfterSave]);

  const scheduleAutoSave = useCallback(() => {
    if (!selectedNoteRef.current || isCreatingRef.current || isOverLimit) return;
    setAutoSaveStatus("pending");
    clearAutoSaveTimer();
    autoSaveTimerRef.current = setTimeout(doAutoSave, AUTO_SAVE_DELAY_MS);
  }, [selectedNoteRef, isCreatingRef, isOverLimit, setAutoSaveStatus, clearAutoSaveTimer, doAutoSave, autoSaveTimerRef]);

  return {
    doAutoSave,
    scheduleAutoSave,
    clearAutoSaveTimer,
  } as const;
}
