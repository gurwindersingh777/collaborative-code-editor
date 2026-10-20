export const socketRooms = new Map<string, string>();

export const socketUsers = new Map<string, string>();

export const awarenessClients = new Map<string, { roomId: string; clientId: number }>();

export function forgetSocket(socketId: string): void {
  socketRooms.delete(socketId);
  socketUsers.delete(socketId);
}