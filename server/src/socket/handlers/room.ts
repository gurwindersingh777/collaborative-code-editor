import type { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { getRoomDocument } from "../../yjs/roomDocuments.js";
import { recordJoin } from "../../services/roomPersistence.js";
import { flushRoomSnapshot } from "../../services/roomAutosave.js";

import { isLanguage } from "../../types/language.js";
import type { JoinRoomPayload, RoomUser } from "../../types/socket.js";
import { forgetSocket, socketRooms, socketUsers } from "../state.js";
import { inRoom, onSafe } from "../helpers.js";
import { addActiveUser, getActiveUsers, removeActiveUser } from "../rooms/activeUsers.js";
import { InterviewRole, registerRole } from "../rooms/role.js";
import { getLanguage, hydrateLanguage } from "../rooms/language.js";
import { getTimerPayload } from "../rooms/timer.js";
import { getInterviewerMode } from "../rooms/interviewerMode.js";

const MAX_ROOM_ID_LENGTH = 64;

function isValidRoomId(roomId: unknown): roomId is string {
  return typeof roomId === "string" && roomId.length > 0 && roomId.length <= MAX_ROOM_ID_LENGTH;
}

function isValidUser(user: unknown): user is RoomUser {
  if (!user || typeof user !== "object") return false;
  const { id, name, color } = user as Record<string, unknown>;
  return typeof id === "string" && typeof name === "string" && typeof color === "string";
}

function broadcastPresence(io: Server, roomId: string): void {
  io.to(roomId).emit("presence-state", { roomId, users: getActiveUsers(roomId) });
}

function flushIfRoomEmpty(io: Server, roomId: string): void {
  const remainingSockets = io.sockets.adapter.rooms.get(roomId)?.size ?? 0;

  if (remainingSockets === 0) {
    void flushRoomSnapshot(roomId).catch((error) => {
      console.error(`Final snapshot save failed for room ${roomId}:`, error);
    });
  }
}

function removeFromRoom(io: Server, socket: Socket, roomId: string): void {
  removeActiveUser(roomId, socket.id);
  broadcastPresence(io, roomId);
  flushIfRoomEmpty(io, roomId);
}

export function registerRoomHandlers(io: Server, socket: Socket) {

  onSafe(socket, "join-room", async ({ roomId, user }: JoinRoomPayload) => {
    if (!isValidRoomId(roomId) || !isValidUser(user)) return;

    const previousRoom = socketRooms.get(socket.id);
    if (previousRoom && previousRoom !== roomId) {
      socket.leave(previousRoom);
      removeFromRoom(io, socket, previousRoom);
    }
    socket.join(roomId);
    socketRooms.set(socket.id, roomId);
    socketUsers.set(socket.id, user.id);

    try {
      const room = await recordJoin(roomId, user);
      const ydoc = await getRoomDocument(roomId);

      if (socketRooms.get(socket.id) !== roomId || !socket.rooms.has(roomId)) return;

      const role: InterviewRole = room.hostUserId === user.id ? "interviewer" : "candidate";
      registerRole(roomId, user.id, role);

      if (isLanguage(room.language)) hydrateLanguage(roomId, room.language);

      addActiveUser(roomId, { socketId: socket.id, name: user.name, color: user.color });
      broadcastPresence(io, roomId);

      socket.emit("interview-role", role);
      socket.emit("language-state", getLanguage(roomId));
      socket.emit("timer-state", getTimerPayload(roomId));
      socket.emit("interviewer-mode-state", getInterviewerMode(roomId));

      socket.emit("yjs-sync", {
        roomId,
        update: Y.encodeStateAsUpdate(ydoc),
        stateVector: Y.encodeStateVector(ydoc),
      });

      io.to(roomId).emit("awareness-request", { roomId });
    } catch (error) {
      console.error(`Failed to initialize room ${roomId}:`, error);

      if (socketRooms.get(socket.id) === roomId) {
        socket.leave(roomId);
        forgetSocket(socket.id);
        removeFromRoom(io, socket, roomId);
        socket.emit("join-error", { roomId });
      }
    }
  });

  onSafe(socket, "leave-room", (roomId: string) => {
    if (!inRoom(socket, roomId)) return;

    socket.leave(roomId);
    forgetSocket(socket.id);
    removeFromRoom(io, socket, roomId);
  });

  onSafe(socket, "disconnect", () => {
    const roomId = socketRooms.get(socket.id);
    forgetSocket(socket.id);

    if (roomId) removeFromRoom(io, socket, roomId);
  });
}