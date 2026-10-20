import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import type { TimerState } from "@/types/room";

type SessionTimerProps = { roomId: string };

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SessionTimer({ roomId }: SessionTimerProps) {
  const [timer, setTimer] = useState<TimerState>({ running: false, startedAt: null, elapsed: 0 });
  const [clockOffset, setClockOffset] = useState(0); // server clock minus my clock, in ms
  const [displayMs, setDisplayMs] = useState(0);

  // The server pushes the timer when we join, so we only listen
  useEffect(() => {
    function handleTimerState(next: TimerState) {
      if (typeof next.serverNow === "number") setClockOffset(next.serverNow - Date.now());
      setTimer(next);
    }

    socket.on("timer-state", handleTimerState);
    return () => { socket.off("timer-state", handleTimerState); };
  }, []);

  useEffect(() => {
    function updateDisplay() {
      if (!timer.running || timer.startedAt === null) {
        setDisplayMs(timer.elapsed);
        return;
      }
      const now = Date.now() + clockOffset; // my clock, corrected to the server's
      setDisplayMs(timer.elapsed + Math.max(0, now - timer.startedAt));
    }

    updateDisplay();
    if (!timer.running) return;

    const interval = setInterval(updateDisplay, 250);
    return () => clearInterval(interval);
  }, [timer, clockOffset]);

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono tabular-nums">{formatTime(displayMs)}</span>

      <button
        onClick={() => socket.emit(timer.running ? "pause-timer" : "start-timer", roomId)}
        className="btn"
      >
        {timer.running ? "Pause" : "Start"}
      </button>
      <button onClick={() => socket.emit("reset-timer", roomId)} className="btn">Reset</button>
    </div>
  );
}