import * as Y from "yjs";
import type { Socket } from "socket.io-client";

type Bytes = ArrayBuffer | Uint8Array;

type YjsUpdatePayload = {
  roomId: string;
  update: Bytes;
  stateVector?: Bytes;
};

export function setupYjsSync(socket: Socket, roomId: string, ydoc: Y.Doc, onInitialSync?: () => void) {

  function handleLocalUpdate(update: Uint8Array, origin: unknown) {
    if (origin === "remote") return;
    socket.emit("yjs-update", { roomId, update });
  }

  function handleRemoteUpdate(data: YjsUpdatePayload) {
    if (data.roomId !== roomId) return;
    Y.applyUpdate(ydoc, new Uint8Array(data.update), "remote");
  }

  function handleInitialSync(data: YjsUpdatePayload) {
    if (data.roomId !== roomId) return;
    Y.applyUpdate(ydoc, new Uint8Array(data.update), "remote");

    if (data.stateVector) {
      const missing = Y.encodeStateAsUpdate(ydoc, new Uint8Array(data.stateVector));

      if (missing.length > 2) {
        socket.emit("yjs-update", { roomId, update: missing });
      }
    }

    onInitialSync?.();
  }

  ydoc.on("update", handleLocalUpdate);
  socket.on("yjs-update", handleRemoteUpdate);
  socket.on("yjs-sync", handleInitialSync);

  return () => {
    ydoc.off("update", handleLocalUpdate);
    socket.off("yjs-update", handleRemoteUpdate);
    socket.off("yjs-sync", handleInitialSync);
  };
}