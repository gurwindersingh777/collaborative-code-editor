import type { Socket } from "socket.io";

export function inRoom(socket: Socket, roomId: unknown): roomId is string {
  return typeof roomId === "string" && socket.rooms.has(roomId);
}

export function toBytes(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return null;
}

export function onSafe(socket: Socket, event: string, handler: (...args: any[]) => unknown) {
  socket.on(event, (...args) => {
    try {
      const result = handler(...args);
      if (result instanceof Promise) {
        result.catch((error) => console.error(`Handler "${event}" failed:`, error));
      }
    } catch (error) {
      console.error(`Handler "${event}" failed:`, error);
    }
  });
}