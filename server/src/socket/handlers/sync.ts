import type { Socket } from "socket.io";
import * as Y from "yjs";
import type { AwarenessUpdatePayload, YjsUpdatePayload } from "../../types/socket.js";
import { awarenessClients, socketRooms, socketUsers } from "../state.js";
import { inRoom, onSafe, toBytes } from "../helpers.js";
import { getInterviewerMode } from "../rooms/interviewerMode.js";
import { isInterviewer } from "../rooms/role.js";
import { getRoomDocument } from "../../yjs/roomDocuments.js";

export function registerSyncHandlers(socket: Socket) {

  // Code and problem statement
  onSafe(socket, "yjs-update", async ({ roomId, update }: YjsUpdatePayload) => {
    if (!inRoom(socket, roomId)) return;

    const bytes = toBytes(update);
    if (!bytes) return;

    const userId = socketUsers.get(socket.id);
    if (!userId) return;

    if (getInterviewerMode(roomId) && !isInterviewer(roomId, userId)) return;

    try {
      const ydoc = await getRoomDocument(roomId);
      if (!inRoom(socket, roomId) || socketRooms.get(socket.id) !== roomId) return;
      Y.applyUpdate(ydoc, bytes, "remote");
    } catch (error) {
      console.warn("Rejected invalid Yjs update:", error);
      return;
    }

    socket.to(roomId).emit("yjs-update", { roomId, update: bytes });
  });

  // Cursors and selections
  onSafe(socket, "awareness-update", ({ roomId, clientId, update }: AwarenessUpdatePayload) => {
    if (!inRoom(socket, roomId)) return;
    if (typeof clientId !== "number") return;

    const bytes = toBytes(update);
    if (!bytes) return;

    awarenessClients.set(socket.id, { roomId, clientId });
    socket.to(roomId).emit("awareness-update", { roomId, update: bytes });
  });

  // When a socket disconnects, remove its cursor from everyone's editor
  onSafe(socket, "disconnect", () => {
    const awarenessClient = awarenessClients.get(socket.id);
    if (!awarenessClient) return;

    awarenessClients.delete(socket.id);
    
    const reconnected = [...awarenessClients.values()].some(
      (c) => c.roomId === awarenessClient.roomId && c.clientId === awarenessClient.clientId
    );

    if (!reconnected) {
      socket.to(awarenessClient.roomId).emit("awareness-remove", awarenessClient);
    }
  });
}