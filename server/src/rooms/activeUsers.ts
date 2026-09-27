export type ActiveUser = {
  socketId: string;
  name: string;
  color: string;
};

const activeUsers = new Map<string, Map<string, ActiveUser>>();

export function addActiveUser(roomId: string, user: ActiveUser) {
  let roomUsers = activeUsers.get(roomId);

  if (!roomUsers) {
    roomUsers = new Map();
    activeUsers.set(roomId, roomUsers);
  }

  roomUsers.set(user.socketId, user);
}

export function removeActiveUser(roomId: string, socketId: string) {
  const roomUsers = activeUsers.get(roomId);

  if (!roomUsers) return;

  roomUsers.delete(socketId);

  if (roomUsers.size === 0) activeUsers.delete(roomId);
}

export function getActiveUsers(roomId: string): ActiveUser[] {
  const roomUsers = activeUsers.get(roomId);

  if (!roomUsers) return [];

  return Array.from(roomUsers.values());
}