import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";


type TimerState = {
  running: boolean;
  startedAt: number | null;
  elapsed: number;
};

type SessionTimerProps = {
  roomId: string;
};

function formatTime(seconds: number) {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function SessionTimer({ roomId }: SessionTimerProps) {
  const [timer, setTimer] = useState<TimerState>({
    running: false,
    startedAt: null,
    elapsed: 0,
  });

  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    function handleTimerState(nextTimer: TimerState) {
      setTimer(nextTimer);
    }

    function requestTimerState() {
      socket.emit("request-timer-state", roomId);
    }

    socket.on("timer-state", handleTimerState);

    if (socket.connected) requestTimerState();

    socket.on("connect", requestTimerState);

    return () => {
      socket.off("timer-state", handleTimerState);
      socket.off("connect", requestTimerState);
    };
  }, [roomId]);

  useEffect(() => {
    function updateDisplay() {
      if (!timer.running || timer.startedAt === null) {
        setDisplaySeconds(timer.elapsed);
        return;
      }

      const runningSeconds = Math.floor((Date.now() - timer.startedAt) / 1000);
      setDisplaySeconds(timer.elapsed + runningSeconds);
    }

    updateDisplay();

    if (!timer.running) return;

    const interval = setInterval(updateDisplay, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  function handleStart() {
    socket.emit("start-timer", roomId);
  }

  function handlePause() {
    socket.emit("pause-timer", roomId);
  }

  function handleReset() {
    socket.emit("reset-timer", roomId);
  }


  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-lg font-semibold">{formatTime(displaySeconds)}</span>

      {!timer.running ?
        <button onClick={handleStart} className="rounded border px-3 py-1 text-sm">Start</button>
        :
        <button onClick={handlePause} className="rounded border px-3 py-1 text-sm">Pause</button>
      }

      <button onClick={handleReset} className="rounded border px-3 py-1 text-sm">Reset</button>
    </div>
  );
}