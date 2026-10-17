
import * as Y from "yjs";
import prisma from "../lib/prisma.js";

const SNAPSHOTS_TO_KEEP = 5;

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

  const created = await prisma.snapshot.create({
    data: { roomId, state: Buffer.from(Y.encodeStateAsUpdate(ydoc)) }
  })

  const keep = await prisma.snapshot.findMany({
    where: { roomId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: SNAPSHOTS_TO_KEEP,
    select: { id: true },
  })

  await prisma.snapshot.deleteMany({
    where: { roomId, id: { notIn: keep.map((s) => s.id) } },
  });

  return created;
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
