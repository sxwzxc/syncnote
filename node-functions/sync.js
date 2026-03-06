/**
 * node-functions/sync.js
 *
 * WebSocket endpoint for real-time note sync across devices.
 *
 * Path: /sync  (matches the URL ws(s)://host/sync)
 *
 * Protocol (client → server):
 *   { type: 'subscribe',   noteId: string }   — subscribe to updates for a note
 *   { type: 'unsubscribe' }                   — unsubscribe from current note
 *   { type: 'note_updated', noteId, updatedAt } — broadcast after saving a note
 *   { type: 'heartbeat' }                     — keepalive ping
 *
 * Protocol (server → client):
 *   { type: 'connected' }
 *   { type: 'subscribed',   noteId: string }
 *   { type: 'note_updated', noteId, updatedAt } — forwarded to other subscribers
 *   { type: 'heartbeat' }
 *
 * Design notes:
 *   - In-memory Map tracks subscribers per noteId within this server instance.
 *   - Clients on different edge nodes communicate via the existing KV polling
 *     fallback (still active in the frontend, interval 1.5 s).
 *   - No auth is enforced here; the KV data itself is auth-protected by the
 *     REST API. Worst case an unauthenticated WS connection only receives
 *     noteId + updatedAt metadata, never note content.
 */

// Per-instance in-memory subscriber store: noteId → Set<WebSocket>
const noteSubscribers = new Map();

function subscribe(noteId, ws) {
  if (!noteSubscribers.has(noteId)) {
    noteSubscribers.set(noteId, new Set());
  }
  noteSubscribers.get(noteId).add(ws);
}

function unsubscribe(noteId, ws) {
  const subs = noteSubscribers.get(noteId);
  if (!subs) return;
  subs.delete(ws);
  if (subs.size === 0) noteSubscribers.delete(noteId);
}

/** Broadcast to every subscriber of noteId except the sender. */
function broadcast(noteId, payload, senderWs) {
  const subs = noteSubscribers.get(noteId);
  if (!subs) return;
  const msg = JSON.stringify(payload);
  for (const ws of subs) {
    if (ws === senderWs) continue;
    try {
      ws.send(msg);
    } catch {
      // Client already disconnected — clean up lazily
      subs.delete(ws);
    }
  }
  if (subs.size === 0) noteSubscribers.delete(noteId);
}

export const onRequest = async (context) => {
  const upgradeHeader = context.request.headers.get('upgrade');

  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return new Response(
      'This endpoint requires a WebSocket connection (ws:// or wss://).',
      {
        status: 426,
        headers: { 'Upgrade': 'websocket', 'Content-Type': 'text/plain' },
      },
    );
  }

  // Per-connection state
  let currentNoteId = null;

  return {
    websocket: {
      onopen(ws) {
        ws.send(JSON.stringify({ type: 'connected' }));
      },

      onmessage(ws, message) {
        let data;
        try {
          const text = typeof message === 'string' ? message : message.toString();
          data = JSON.parse(text);
        } catch {
          return; // ignore non-JSON
        }

        switch (data.type) {
          case 'subscribe': {
            const noteId = data.noteId;
            if (!noteId || typeof noteId !== 'string') return;
            // Unsubscribe from previous note first
            if (currentNoteId) unsubscribe(currentNoteId, ws);
            currentNoteId = noteId;
            subscribe(currentNoteId, ws);
            ws.send(JSON.stringify({ type: 'subscribed', noteId: currentNoteId }));
            break;
          }

          case 'unsubscribe': {
            if (currentNoteId) {
              unsubscribe(currentNoteId, ws);
              currentNoteId = null;
            }
            break;
          }

          case 'note_updated': {
            const noteId = data.noteId;
            if (!noteId || typeof noteId !== 'string') return;
            // Forward the notification to all other subscribers of this note
            broadcast(
              noteId,
              { type: 'note_updated', noteId, updatedAt: data.updatedAt },
              ws,
            );
            break;
          }

          case 'heartbeat': {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
            break;
          }

          default:
            break;
        }
      },

      onclose(ws) {
        if (currentNoteId) {
          unsubscribe(currentNoteId, ws);
          currentNoteId = null;
        }
      },

      onerror(ws) {
        if (currentNoteId) {
          unsubscribe(currentNoteId, ws);
          currentNoteId = null;
        }
      },
    },
  };
};
