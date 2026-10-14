
import * as Y from "yjs";
import { saveSnapshot } from "./roomPersistence.js";

const AUTOSAVE_INTERVAL_MS = 10_000;

const roomDocuments = new Map<string, Y.Doc>();
const dirtyRooms = new Set<string>();
const pendingSaves = new Map<string, Promise<void>>();

let autosaveInterval: ReturnType<typeof setInterval> | undefined;

function saveRoom(roomId: string): Promise<void> {
  const existingSave = pendingSaves.get(roomId);

  if (existingSave) return existingSave;

  const ydoc = roomDocuments.get(roomId);

  if (!ydoc) return Promise.resolve();

  const savePromise = (async () => {
    try {
      await saveSnapshot(roomId, ydoc);
      console.log(`Saved snapshot for room ${roomId}`);
    } catch (error) {
      // Retry on a future autosave interval.
      dirtyRooms.add(roomId);
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
  if (autosaveInterval) {
    return;
  }

  autosaveInterval = setInterval(() => {
    for (const roomId of dirtyRooms) {
      if (pendingSaves.has(roomId)) {
        continue;
      }

      // Clear before saving so edits made during the save
      // mark the room dirty again.
      dirtyRooms.delete(roomId);

      void saveRoom(roomId).catch(() => {
        // saveRoom logs the error and marks the room dirty.
      });
    }
  }, AUTOSAVE_INTERVAL_MS);
}

export function registerRoomDocument(roomId: string, ydoc: Y.Doc): void {
  roomDocuments.set(roomId, ydoc);

  // Only actual document edits mark a room as dirty.
  ydoc.on("update", () => { dirtyRooms.add(roomId) });
  startAutosave();
}

export async function flushRoomSnapshot(roomId: string): Promise<void> {
  const currentSave = pendingSaves.get(roomId);

  if (currentSave) {
    try {
      await currentSave;
    } catch {
      // A failed save marks the room dirty for retry.
    }
  }

  if (!dirtyRooms.has(roomId)) return;

  dirtyRooms.delete(roomId);

  await saveRoom(roomId);
}
