import * as Y from "yjs";
import { saveSnapshot } from "./roomPersistence.js";

const AUTOSAVE_INTERVAL_MS = 10_000;

const liveDocuments = new Map<string, Y.Doc>();
const dirtyRooms = new Set<string>();
const pendingSaves = new Map<string, Promise<void>>();

let autosaveInterval: ReturnType<typeof setInterval> | undefined;

function saveRoom(roomId: string): Promise<void> {
  const existingSave = pendingSaves.get(roomId);
  if (existingSave) return existingSave;

  const ydoc = liveDocuments.get(roomId);
  if (!ydoc) return Promise.resolve();

  const savePromise = (async () => {
    try {
      await saveSnapshot(roomId, ydoc);
    } catch (error) {
      dirtyRooms.add(roomId); // retry on a later tick
      console.error(`Failed to save room ${roomId}:`, error);
      throw error;
    } finally {
      pendingSaves.delete(roomId);
    }
  })();

  pendingSaves.set(roomId, savePromise);
  return savePromise;
}

function startAutosave(): void {
  if (autosaveInterval) return;

  autosaveInterval = setInterval(() => {
    for (const roomId of dirtyRooms) {
      if (pendingSaves.has(roomId)) continue;
      dirtyRooms.delete(roomId);

      void saveRoom(roomId).catch(() => {
        // saveRoom already logged the error and re-marked the room dirty
      });
    }
  }, AUTOSAVE_INTERVAL_MS);
}

export function registerRoomDocument(roomId: string, ydoc: Y.Doc): void {
  liveDocuments.set(roomId, ydoc);
  ydoc.on("update", () => { dirtyRooms.add(roomId); });
  startAutosave();
}

// Save right now (used when the last person leaves)
export async function flushRoomSnapshot(roomId: string): Promise<void> {
  const currentSave = pendingSaves.get(roomId);

  if (currentSave) {
    try {
      await currentSave;
    } catch { }
  }

  if (!dirtyRooms.has(roomId)) return;

  dirtyRooms.delete(roomId);
  await saveRoom(roomId);
}

// Used on shutdown
export async function flushAllRooms(): Promise<void> {
  if (autosaveInterval) clearInterval(autosaveInterval);
  await Promise.allSettled([...liveDocuments.keys()].map((id) => flushRoomSnapshot(id)));
}

export function unregisterRoomDocument(roomId: string): void {
  liveDocuments.delete(roomId); dirtyRooms.delete(roomId);
}