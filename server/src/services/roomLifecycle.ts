import type { Server } from "socket.io";
import { flushRoomSnapshot, unregisterRoomDocument } from "./roomAutosave.js";
import { releaseRoomDocument } from "../yjs/roomDocuments.js";
import { clearTimer } from "../socket/rooms/timer.js";
import { clearRoles } from "../socket/rooms/role.js";
import { clearLanguage } from "../socket/rooms/language.js";
import { clearInterviewerMode } from "../socket/rooms/interviewerMode.js";
import { clearChat } from "../socket/rooms/chat.js";

export const EVICT_AFTER_MS = 10 * 60_000;

const pending = new Map<string, NodeJS.Timeout>();

const isEmpty = (io: Server, roomId: string) =>
  (io.sockets.adapter.rooms.get(roomId)?.size ?? 0) === 0;

export function cancelEviction(roomId: string): void {
  const timer = pending.get(roomId);
  if (timer) clearTimeout(timer);
  pending.delete(roomId);
}

// Called when the last person leaves
export function scheduleEviction(io: Server, roomId: string): void {
  cancelEviction(roomId);

  const timer = setTimeout(() => {
    pending.delete(roomId);
    void evict(io, roomId);
  }, EVICT_AFTER_MS);

  timer.unref(); // this timer alone never keeps the server alive
  pending.set(roomId, timer);
}

async function evict(io: Server, roomId: string): Promise<void> {
  if (!isEmpty(io, roomId)) return;

  try {
    await flushRoomSnapshot(roomId);
  } catch (error) {
    console.error(`Could not save room ${roomId}; keeping it in memory:`, error);
    scheduleEviction(io, roomId);
    return;
  }

  // Someone may have joined while we were saving
  if (!isEmpty(io, roomId)) return;

  unregisterRoomDocument(roomId);
  releaseRoomDocument(roomId);
  clearTimer(roomId);
  clearRoles(roomId);
  clearLanguage(roomId);
  clearInterviewerMode(roomId);
  clearChat(roomId);
  console.log(`Freed room ${roomId}`);
}