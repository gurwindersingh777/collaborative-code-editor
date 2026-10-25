import type { Server, Socket } from "socket.io";
import type { ChatMessage } from "../../types/chat.js";
import type { SendChatPayload } from "../../types/socket.js";
import { inRoom, onSafe } from "../helpers.js";
import { getActiveUsers } from "../rooms/activeUsers.js";
import { randomUUID } from "crypto";
import { addChatMessage } from "../rooms/chat.js";

const MAX_CHAT_LENGTH = 500;

export function registerChatHandlers(io: Server, socket: Socket) {
  onSafe(socket, "send-chat-message", ({ roomId, message }: SendChatPayload) => {
    if (!inRoom(socket, roomId) || typeof message !== "string") return;

    const text = message.trim().slice(0, MAX_CHAT_LENGTH);
    if (!text) return;

    const sender = getActiveUsers(roomId).find((u) => u.socketId === socket.id);
    if (!sender) return;

    const chatMessage: ChatMessage = {
      id: randomUUID(),
      roomId,
      user: { name: sender.name, color: sender.color },
      message: text,
      timestamp: Date.now(),
    };

    addChatMessage(roomId, chatMessage);
    io.to(roomId).emit("chat-message", chatMessage);
  });
}