import { applyAwarenessUpdate, encodeAwarenessUpdate, removeAwarenessStates, Awareness } from "y-protocols/awareness";
import type { Socket } from "socket.io-client";

type AwarenessPayload = {
  roomId: string;
  clientId: number;
  update: number[];
};

type HandleAwarenessUpdate = {
  added: number[];
  updated: number[];
  removed: number[];
}

export function setupAwarenessSync(socket: Socket, roomId: string, awareness: Awareness) {

  function sendAwarenessUpdate(changedClients: number[]) {
    if (changedClients.length === 0) return;
    if (!socket.connected) return;

    const update = encodeAwarenessUpdate(awareness, changedClients);
    socket.emit("awareness-update", { roomId, clientId: awareness.clientID, update: Array.from(update) });
  }

  function handleAwarenessUpdate({ added, updated, removed }: HandleAwarenessUpdate, origin: unknown) {
    if (origin === "remote") return;

    const changedClients = [...added, ...updated, ...removed];
    sendAwarenessUpdate(changedClients);
  }

  function handleRemoteAwareness(data: AwarenessPayload) {
    if (data.roomId !== roomId) return;

    const update = new Uint8Array(data.update);
    applyAwarenessUpdate(awareness, update, "remote");
  }

  function handleAwarenessRequest(data: { roomId: string }) {
    if (data.roomId !== roomId) return;

    const clients = Array.from(awareness.getStates().keys());
    sendAwarenessUpdate(clients);
  }

  function handleSocketConnect() {
    const clients = Array.from(awareness.getStates().keys());
    sendAwarenessUpdate(clients);
  }

  function handleRemoteAwarenessRemove(data: { roomId: string; clientId: number }) {
    if (data.roomId !== roomId) return;
    removeAwarenessStates(awareness, [data.clientId], "remote");
  }

  awareness.on("update", handleAwarenessUpdate);
  socket.on("awareness-update", handleRemoteAwareness);
  socket.on("awareness-request", handleAwarenessRequest);
  socket.on("connect", handleSocketConnect);
  socket.on("awareness-remove", handleRemoteAwarenessRemove);

  return () => {
    awareness.off("update", handleAwarenessUpdate);
    socket.off("awareness-update", handleRemoteAwareness);
    socket.off("awareness-request", handleAwarenessRequest);
    socket.off("connect", handleSocketConnect);
    socket.off("awareness-remove", handleRemoteAwarenessRemove);
  }
}