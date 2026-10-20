import type { Server, Socket } from "socket.io";

import type { InterviewerModePayload } from "../../types/socket.js";
import { socketUsers } from "../state.js";
import { inRoom, onSafe } from "../helpers.js";
import { isInterviewer } from "../rooms/role.js";
import { setInterviewerMode } from "../rooms/interviewerMode.js";

export function registerInterviewerModeHandlers(io: Server, socket: Socket) {
  onSafe(socket, "request-interviewer-mode", ({ roomId, enabled }: InterviewerModePayload) => {
    if (!inRoom(socket, roomId)) return;

    const userId = socketUsers.get(socket.id);
    if (!userId || !isInterviewer(roomId, userId)) return;

    io.to(roomId).emit("interviewer-mode-state", setInterviewerMode(roomId, Boolean(enabled)));
  });
}