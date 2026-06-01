import { useEffect, useRef, useCallback } from "react";
import {
  WS_HEARTBEAT_MS,
  WS_RECONNECT_BASE_MS,
  WS_RECONNECT_MAX_MS,
  POLL_INTERVAL_MS,
  POLL_INTERVAL_WS_MS,
  API_BASE,
} from "~/lib/types";
import type { Note, NoteIndex, NoteImage, AutoSaveStatus } from "~/lib/types";

interface UseSyncOptions {
  selectedNoteRef: React.RefObject<Note | null>;
  isEditingRef: React.RefObject<boolean>;
  isCreatingRef: React.RefObject<boolean>;
  editTitleRef: React.RefObject<string>;
  editContentRef: React.RefObject<string>;
  editImagesRef: React.RefObject<NoteImage[]>;
  autoSaveTimerRef: React.RefObject<ReturnType<typeof setTimeout> | null>;
  autoSaveStatusRef: React.RefObject<AutoSaveStatus>;
  lastSavedRef: React.RefObject<{ title: string; content: string; images: NoteImage[] } | null>;
  setNotesList: React.Dispatch<React.SetStateAction<NoteIndex[]>>;
  setSelectedNote: (note: Note | null) => void;
  setEditTitle: (title: string) => void;
  setEditContent: (content: string) => void;
  setEditImages: (images: NoteImage[]) => void;
  setAutoSaveStatus: (status: AutoSaveStatus) => void;
  setRemoteSyncStatus: (status: "idle" | "updated") => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
}

export function useSync({
  selectedNoteRef,
  isEditingRef,
  isCreatingRef,
  editTitleRef,
  editContentRef,
  editImagesRef,
  autoSaveTimerRef,
  autoSaveStatusRef,
  lastSavedRef,
  setNotesList,
  setSelectedNote,
  setEditTitle,
  setEditContent,
  setEditImages,
  setAutoSaveStatus,
  setRemoteSyncStatus,
  wsRef,
}: UseSyncOptions) {
  const wsReconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsHeartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsSubscribedNoteIdRef = useRef<string | null>(null);
  const wsConnectedRef = useRef(false);
  const pollFnRef = useRef<(() => void) | null>(null);
  const remoteSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRemoteNoteRef = useRef<Note | null>(null);
  const pendingRemoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyRemoteNote = useCallback((updated: Note) => {
    setSelectedNote(updated);
    selectedNoteRef.current = updated;

    if (remoteSyncTimerRef.current) clearTimeout(remoteSyncTimerRef.current);
    setRemoteSyncStatus("updated");
    remoteSyncTimerRef.current = setTimeout(() => setRemoteSyncStatus("idle"), 3000);

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
  }, [selectedNoteRef, isEditingRef, lastSavedRef, setSelectedNote, setEditTitle, setEditContent, setEditImages, setRemoteSyncStatus]);

  const tryApplyPendingRemote = useCallback(() => {
    const pending = pendingRemoteNoteRef.current;
    if (!pending) return;
    pendingRemoteNoteRef.current = null;
    if (pendingRemoteTimerRef.current) {
      clearTimeout(pendingRemoteTimerRef.current);
      pendingRemoteTimerRef.current = null;
    }

    const hasPendingChanges =
      autoSaveTimerRef.current !== null ||
      autoSaveStatusRef.current === "pending" ||
      autoSaveStatusRef.current === "saving";

    if (hasPendingChanges) {
      pendingRemoteNoteRef.current = pending;
      pendingRemoteTimerRef.current = setTimeout(tryApplyPendingRemote, 500);
      return;
    }

    applyRemoteNote(pending);
  }, [applyRemoteNote, autoSaveTimerRef, autoSaveStatusRef]);

  const poll = useCallback(async () => {
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

      const noteRes = await fetch(`${API_BASE}/${currentNote.id}`);
      if (!noteRes.ok) return;
      const updated: Note = await noteRes.json();

      const hasPendingChanges =
        autoSaveTimerRef.current !== null ||
        autoSaveStatusRef.current === "pending" ||
        autoSaveStatusRef.current === "saving";

      if (hasPendingChanges) {
        pendingRemoteNoteRef.current = updated;
        if (pendingRemoteTimerRef.current) clearTimeout(pendingRemoteTimerRef.current);
        pendingRemoteTimerRef.current = setTimeout(tryApplyPendingRemote, 500);
        return;
      }

      applyRemoteNote(updated);
    } catch {}
  }, [selectedNoteRef, autoSaveTimerRef, autoSaveStatusRef, setNotesList, applyRemoteNote, tryApplyPendingRemote]);

  useEffect(() => {
    pollFnRef.current = poll;
  }, [poll]);

  useEffect(() => {
    const id = setInterval(
      () => pollFnRef.current?.(),
      wsConnectedRef.current ? POLL_INTERVAL_WS_MS : POLL_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, []);

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
          wsConnectedRef.current = true;
          const noteId = wsSubscribedNoteIdRef.current;
          if (noteId) ws.send(JSON.stringify({ type: 'subscribe', noteId }));
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
                pollFnRef.current?.();
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          wsConnectedRef.current = false;
          if (wsHeartbeatTimerRef.current) {
            clearInterval(wsHeartbeatTimerRef.current);
            wsHeartbeatTimerRef.current = null;
          }
          wsRef.current = null;
          if (unmounted) return;
          wsReconnectTimerRef.current = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, WS_RECONNECT_MAX_MS);
            connect();
          }, reconnectDelay);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {}
    }

    connect();

    return () => {
      unmounted = true;
      if (wsReconnectTimerRef.current) clearTimeout(wsReconnectTimerRef.current);
      if (wsHeartbeatTimerRef.current) clearInterval(wsHeartbeatTimerRef.current);
      if (pendingRemoteTimerRef.current) clearTimeout(pendingRemoteTimerRef.current);
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { wsSubscribedNoteIdRef, remoteSyncTimerRef, tryApplyPendingRemote } as const;
}
