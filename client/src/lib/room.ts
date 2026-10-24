export function generateRoomId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 16);
}