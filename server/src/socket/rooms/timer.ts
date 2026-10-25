export type TimerState = {
  running: boolean;
  startedAt: number | null; // server clock, ms
  elapsed: number;          // ms accumulated before the current run
};

const timers = new Map<string, TimerState>();

function getTimer(roomId: string): TimerState {
  let timer = timers.get(roomId);
  if (!timer) {
    timer = { running: false, startedAt: null, elapsed: 0 };
    timers.set(roomId, timer);
  }
  return timer;
}

export function startTimer(roomId: string): void {
  const timer = getTimer(roomId);
  if (timer.running) return;

  timer.running = true;
  timer.startedAt = Date.now();
}

export function pauseTimer(roomId: string): void {
  const timer = getTimer(roomId);
  if (!timer.running || timer.startedAt === null) return;

  timer.elapsed += Date.now() - timer.startedAt;
  timer.running = false;
  timer.startedAt = null;
}

export function resetTimer(roomId: string): void {
  const timer = getTimer(roomId);
  timer.running = false;
  timer.startedAt = null;
  timer.elapsed = 0;
}

// Timer state plus the server's clock, so each browser can correct for its own clock being off
export function getTimerPayload(roomId: string) {
  return { ...getTimer(roomId), serverNow: Date.now() };
}

export function clearTimer(roomId: string): void {
  timers.delete(roomId);
}