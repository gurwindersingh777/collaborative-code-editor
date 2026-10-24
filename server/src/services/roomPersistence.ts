import * as Y from "yjs";
import prisma from "../lib/prisma.js";
import type { Language } from "../types/language.js";
import { createHash } from "node:crypto";

const SNAPSHOTS_TO_KEEP = 5;

export async function ensureRoom(roomId: string) {
  return prisma.room.upsert({
    where: { id: roomId },
    update: {},
    create: { id: roomId, roomName: `Room ${roomId}` },
  });
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function recordJoin(roomId: string, user: { id: string; name: string }, hostToken: string | null) {
  await ensureRoom(roomId);

  await prisma.participant.upsert({
    where: { roomId_userId: { roomId, userId: user.id } },
    update: { name: user.name },
    create: { roomId, userId: user.id, name: user.name },
  });

  const tokenHash = hostToken ? hashToken(hostToken) : null;
  
  if (tokenHash) {
    await prisma.room.updateMany({
      where: { id: roomId, hostTokenHash: null },
      data: { hostTokenHash: tokenHash },
    });
  }

  const room = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    select: { hostTokenHash: true, language: true },
  });

  return {
    isHost: tokenHash !== null && room.hostTokenHash === tokenHash,
    language: room.language,
  };
}

export async function saveLanguage(roomId: string, language: Language): Promise<void> {
  await prisma.room.update({ where: { id: roomId }, data: { language } });
}

export async function saveSnapshot(roomId: string, ydoc: Y.Doc) {
  await ensureRoom(roomId);

  const created = await prisma.snapshot.create({
    data: { roomId, state: Buffer.from(Y.encodeStateAsUpdate(ydoc)) },
  });

  const keep = await prisma.snapshot.findMany({
    where: { roomId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: SNAPSHOTS_TO_KEEP,
    select: { id: true },
  });

  await prisma.snapshot.deleteMany({
    where: { roomId, id: { notIn: keep.map((s) => s.id) } },
  });

  return created;
}

export async function loadLatestSnapshot(roomId: string): Promise<Uint8Array | null> {
  const snapshot = await prisma.snapshot.findFirst({
    where: { roomId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { state: true },
  });

  return snapshot ? new Uint8Array(snapshot.state) : null;
}

export async function saveParticipantName(roomId: string, userId: string, name: string): Promise<void> {
  await prisma.participant.updateMany({ where: { roomId, userId }, data: { name } });
}