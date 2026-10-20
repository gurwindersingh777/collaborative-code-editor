import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates, Awareness } from "y-protocols/awareness";
import type { Socket } from "socket.io-client";

type Bytes = ArrayBuffer | Uint8Array;
type AwarenessPayload = { roomId: string; clientId: number; update: Bytes };
type AwarenessChange = { added: number[]; updated: number[]; removed: number[] };

export function setupAwarenessSync(socket: Socket, roomId: string, awareness: Awareness) {

  function sendAwarenessUpdate(changedClients: number[]) {
    if (changedClients.length === 0 || !socket.connected) return;
    const update = encodeAwarenessUpdate(awareness, changedClients);
    socket.emit("awareness-update", { roomId, clientId: awareness.clientID, update });
  }

  function handleAwarenessUpdate({ added, updated, removed }: AwarenessChange, origin: unknown) {
    if (origin === "remote") return;
    sendAwarenessUpdate([...added, ...updated, ...removed]);
  }

  function handleRemoteAwareness(data: AwarenessPayload) {
    if (data.roomId !== roomId) return;
    applyAwarenessUpdate(awareness, new Uint8Array(data.update), "remote");
  }

  function handleAwarenessRequest(data: { roomId: string }) {
    if (data.roomId !== roomId) return;
    const local = awareness.getLocalState();
    if (local) awareness.setLocalState({ ...local });
    sendAwarenessUpdate([awareness.clientID]);
  }

  function handleRemoteAwarenessRemove(data: { roomId: string; clientId: number }) {
    if (data.roomId !== roomId) return;
    removeAwarenessStates(awareness, [data.clientId], "remote");
  }

  awareness.on("update", handleAwarenessUpdate);
  socket.on("awareness-update", handleRemoteAwareness);
  socket.on("awareness-request", handleAwarenessRequest);
  socket.on("awareness-remove", handleRemoteAwarenessRemove);

  return () => {
    awareness.off("update", handleAwarenessUpdate);
    socket.off("awareness-update", handleRemoteAwareness);
    socket.off("awareness-request", handleAwarenessRequest);
    socket.off("awareness-remove", handleRemoteAwarenessRemove);
  };
}