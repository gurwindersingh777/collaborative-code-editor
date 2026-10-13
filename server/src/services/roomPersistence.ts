
import * as Y from "yjs";
import prisma from "../lib/prisma.js";

// Find an existing room or create it if it doesn't exist.
export async function ensureRoom(roomId: string, roomName = `Room ${roomId}`) {
  return prisma.room.upsert({
    where: { id: roomId },
    update: {},
    create: { id: roomId, roomName },
  });
}


// Save the complete Yjs document state as a database snapshot.
export async function saveSnapshot(roomId: string, ydoc: Y.Doc) {
  await ensureRoom(roomId);

  const state = Y.encodeStateAsUpdate(ydoc);

  return prisma.snapshot.create({
    data: {
      roomId,
      state: Buffer.from(state),
    },
  });
}


// Load the most recently saved snapshot for a room.
export async function loadLatestSnapshot(roomId: string): Promise<Uint8Array | null> {
  const snapshot = await prisma.snapshot.findFirst({
    where: { roomId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { state: true },
  });

  if (!snapshot) return null;

  return new Uint8Array(snapshot.state);
}
