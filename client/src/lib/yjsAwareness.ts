import { applyAwarenessUpdate, encodeAwarenessUpdate, Awareness } from "y-protocols/awareness";
import type { Socket } from "socket.io-client";

type AwarenessPayload = {
  roomId: string;
  update: number[];
};

export function setupAwarenessSync(socket: Socket, roomId: string, awareness: Awareness) {
  function sendAwarenessUpdate(changedClients: number[]) {
    if (changedClients.length === 0) return;

    const update = encodeAwarenessUpdate(awareness, changedClients);

    socket.emit("awareness-update", {
      roomId,
      update: Array.from(update),
    });
  }

  function handleAwarenessUpdate({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) {
    if (origin === "remote") return;

    const changedClients = [...added, ...updated, ...removed];
    sendAwarenessUpdate(changedClients);
  }

  function handleRemoteAwareness(data: AwarenessPayload,) {
    if (data.roomId !== roomId) return;

    const update = new Uint8Array(data.update);

    applyAwarenessUpdate(awareness, update, "remote");
  }

  function handleAwarenessRequest(data: { roomId: string }) {
    if (data.roomId !== roomId) return;

    const clients = Array.from(awareness.getStates().keys());

    if (clients.length === 0) return;

    sendAwarenessUpdate(clients);
  }

  awareness.on("update", handleAwarenessUpdate);
  socket.on("awareness-update", handleRemoteAwareness);
  socket.on("awareness-request", handleAwarenessRequest);

  return () => {
    awareness.off("update", handleAwarenessUpdate);
    socket.off("awareness-update", handleRemoteAwareness);
    socket.off("awareness-request", handleAwarenessRequest);
  };
}