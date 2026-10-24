const MAX_CONCURRENT_RUNS = 4; 
const MAX_RUNS_PER_MINUTE = 10;
const WINDOW_MS = 60_000;

let activeRuns = 0;
const runningRooms = new Set<string>();
const recentRuns = new Map<string, number[]>(); 

export function tryStartRun(roomId: string, socketId: string): string | null {
  if (runningRooms.has(roomId)) return "A run is already in progress in this room.";
  if (activeRuns >= MAX_CONCURRENT_RUNS) return "The server is busy. Try again in a few seconds.";

  const now = Date.now();
  const recent = (recentRuns.get(socketId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_RUNS_PER_MINUTE) {
    recentRuns.set(socketId, recent);
    return "Too many runs. Wait a moment and try again.";
  }

  recent.push(now);
  recentRuns.set(socketId, recent);
  runningRooms.add(roomId);
  activeRuns++;
  return null;
}

export function finishRun(roomId: string): void {
  if (runningRooms.delete(roomId)) activeRuns--;
}

export function forgetRunHistory(socketId: string): void {
  recentRuns.delete(socketId);
}