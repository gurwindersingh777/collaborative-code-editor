import type { Server, Socket } from "socket.io";

import { inRoom, onSafe } from "../helpers.js";
import { getTimerPayload, pauseTimer, resetTimer, startTimer } from "../rooms/timer.js";

const timerCommands: Record<string, (roomId: string) => void> = {
  "start-timer": startTimer,
  "pause-timer": pauseTimer,
  "reset-timer": resetTimer,
};

export function registerTimerHandlers(io: Server, socket: Socket) {
  for (const [event, command] of Object.entries(timerCommands)) {
    onSafe(socket, event, (roomId: string) => {
      if (!inRoom(socket, roomId)) return;

      command(roomId);
      io.to(roomId).emit("timer-state", getTimerPayload(roomId));
    });
  }
}