import * as Y from "yjs";

const roomDocuments = new Map<string, Y.Doc>();

export function getRoomDocument(roomId: string): Y.Doc {
  let ydoc = roomDocuments.get(roomId);

  if (!ydoc) {
    ydoc = new Y.Doc();
    roomDocuments.set(roomId, ydoc);

    console.log(`Created Y.Doc for room ${roomId}`);
  }

  return ydoc;
}

export function deleteRoomDocument(roomId: string) {
  const ydoc = roomDocuments.get(roomId);

  if (!ydoc) {
    return;
  }

  ydoc.destroy();
  roomDocuments.delete(roomId);

  console.log(`Deleted Y.Doc for room ${roomId}`);
}