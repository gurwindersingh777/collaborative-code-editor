export type TimerState = {
  running: boolean;
  startedAt: number | null;
  elapsed: number;
}

const timers = new Map<string, TimerState>();

function createDefaultTimer(): TimerState {
  return {
    running: false,
    startedAt: null,
    elapsed: 0,
  };
}

export function getTimer(roomId: string): TimerState {
  let timer = timers.get(roomId);

  if (!timer) {
    timer = createDefaultTimer();
    timers.set(roomId, timer);
  }
  return timer
}

export function startTimer(roomId: string): TimerState {
  const timer = getTimer(roomId);

  if (timer.running) {
    return timer;
  }

  timer.running = true;
  timer.startedAt = Date.now();
  return timer;
}

export function pauseTimer(roomId: string): TimerState {
  const timer = getTimer(roomId);
  if (!timer.running || timer.startedAt === null) return timer;

  timer.elapsed += Math.floor((Date.now() - timer.startedAt) / 1000);
  timer.running = false;
  timer.startedAt = null;
  return timer;
}

export function resetTimer(roomId: string): TimerState {
  const timer = getTimer(roomId);

  timer.running = false;
  timer.startedAt = null;
  timer.elapsed = 0;
  return timer;
}