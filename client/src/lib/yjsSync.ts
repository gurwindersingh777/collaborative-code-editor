import * as Y from "yjs";
import type { Socket } from "socket.io-client";

type YjsUpdatePayload = {
  roomId: string;
  update: number[];
};

export function setupYjsSync(
  socket: Socket,
  roomId: string,
  ydoc: Y.Doc,
  onInitialSync?: () => void,
) {
  function handleLocalUpdate(
    update: Uint8Array,
    origin: unknown,
  ) {
    if (origin === "remote") {
      return;
    }

    socket.emit("yjs-update", {
      roomId,
      update: Array.from(update),
    });
  }

  function handleRemoteUpdate(
    data: YjsUpdatePayload,
  ) {
    if (data.roomId !== roomId) {
      return;
    }

    const update = new Uint8Array(data.update);

    Y.applyUpdate(ydoc, update, "remote");
  }

  function handleInitialSync(
    data: YjsUpdatePayload,
  ) {
    if (data.roomId !== roomId) {
      return;
    }

    const update = new Uint8Array(data.update);

    Y.applyUpdate(ydoc, update, "remote");

    console.log("Yjs initial sync received:", roomId);

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