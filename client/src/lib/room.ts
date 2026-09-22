export function generateRoomId(): string {
  return crypto.randomUUID().slice(0, 8);
}