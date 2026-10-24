const keyFor = (roomId: string) => `host-token:${roomId}`;

export function createHostToken(roomId: string): void {
  try {
    const secret = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    localStorage.setItem(keyFor(roomId), secret);
  } catch {
    // storage blocked (private mode): the room simply has no host
  }
}

export function getHostToken(roomId: string): string | null {
  try {
    return localStorage.getItem(keyFor(roomId));
  } catch {
    return null;
  }
}