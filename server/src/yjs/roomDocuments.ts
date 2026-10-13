import * as Y from "yjs";
import { loadLatestSnapshot } from "../services/roomPersistence.js";

const roomDocuments = new Map<string, Y.Doc>();
const roomInitializations = new Map<string, Promise<Y.Doc>>();

export async function getRoomDocument(roomId: string): Promise<Y.Doc> {

  const existingDocument = roomDocuments.get(roomId);
  if (existingDocument) return existingDocument;

  const pendingInitialization = roomInitializations.get(roomId);
  if (pendingInitialization) return pendingInitialization;

  const initialization = (async () => {
    const ydoc = new Y.Doc();

    try {
      const snapshot = await loadLatestSnapshot(roomId);

      if (snapshot) {
        Y.applyUpdate(ydoc, snapshot, "persistence");
        console.log(`Restored Yjs document for room ${roomId}`);
      } else {
        console.log(`Created new Yjs document for room ${roomId}`);
      }

      roomDocuments.set(roomId, ydoc);

      return ydoc;
    } catch (error) {
      ydoc.destroy();
      throw error;
    } finally {
      roomInitializations.delete(roomId);
    }
  })();

  roomInitializations.set(roomId, initialization);

  return initialization;
}

export function deleteRoomDocument(roomId: string): void {
  const ydoc = roomDocuments.get(roomId);
  if (!ydoc) return;
  ydoc.destroy();
  roomDocuments.delete(roomId);
}
