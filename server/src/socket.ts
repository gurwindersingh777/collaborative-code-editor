import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "node:http";
import * as Y from "yjs";
import { getRoomDocument } from "../src/yjs/roomDocuments.js";
import { addActiveUser, getActiveUsers, removeActiveUser } from "./rooms/activeUsers.js";
import { getTimer, pauseTimer, resetTimer, startTimer } from "./util/timer.js";
import { getLanguage, setLanguage } from "./util/language.js";
import { ChatMessage } from "./types/chat.js";
import { assignRole, isInterviewer } from "./util/role.js";
import { getInterviewerMode, setInterviewerMode } from "./util/interviewerMode.js";

const MAX_ROOM_ID_LENGTH = 64;
const MAX_CHAT_LENGTH = 500;
const SUPPORTED_LANGUAGES = ["javascript", "python"] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];

let ioInstance: Server | null = null;
const awarenessClients = new Map<string, { roomId: string; clientId: number }>();
const socketRooms = new Map<string, string>();
const socketUsers = new Map<string, string>();

// True only if this connection has really joined `roomId`.
function inRoom(socket: Socket, roomId: unknown): roomId is string {
  return typeof roomId === "string" && socket.rooms.has(roomId);
}

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL ?? "http://localhost:3000" },
  });

  ioInstance = io;

  io.on("connection", (socket) => {

    socket.on("join-room", ({ roomId, user }: { roomId: string; user: { id: string; name: string; color: string } }) => {
      // Validate input
      if (typeof roomId != "string" || !roomId || roomId.length > MAX_ROOM_ID_LENGTH) return;
      if (!user || typeof user.id != "string" || typeof user.name !== "string" || typeof user.color !== "string") return;

      // One socket = one room, Leave the old one if switching.
      const previousRoom = socketRooms.get(socket.id);
      if (previousRoom && previousRoom !== roomId) {
        socket.leave(previousRoom);
        removeActiveUser(previousRoom, socket.id);
      }

      socket.join(roomId);
      socketRooms.set(socket.id, roomId);
      socketUsers.set(socket.id, user.id);

      const role = assignRole(roomId, user.id, socket.id);
      addActiveUser(roomId, { socketId: socket.id, name: user.name, color: user.color })

      socket.emit("interview-role", role);
      socket.emit("language-state", getLanguage(roomId));
      socket.emit("timer-state", getTimer(roomId));
      socket.emit("interviewer-mode-state", getInterviewerMode(roomId));

      const ydoc = getRoomDocument(roomId);
      const state = Y.encodeStateAsUpdate(ydoc);
      socket.emit("yjs-sync", { roomId: roomId, update: Array.from(state) });
      socket.to(roomId).emit("awareness-request", { roomId: roomId });
    });


    socket.on("yjs-update", ({ roomId, update }: { roomId: string; update: number[] }) => {
      if (!inRoom(socket, roomId) || !Array.isArray(update)) return;

      try {
        const ydoc = getRoomDocument(roomId);
        const uint8Update = new Uint8Array(update);
        Y.applyUpdate(ydoc, uint8Update, "remote");
      } catch (error) {
        console.warn("Rejected invalid Yjs update:", error);
        return;
      }
      socket.to(roomId).emit("yjs-update", { roomId, update });
    });


    socket.on("leave-room", (roomId: string) => {
      if (!inRoom(socket, roomId)) return;
      socket.leave(roomId);
      removeActiveUser(roomId, socket.id);
      socketRooms.delete(socket.id);
      socketUsers.delete(socket.id);
    });


    socket.on("disconnect", () => {
      const roomId = socketRooms.get(socket.id);
      const awarenessClient = awarenessClients.get(socket.id);

      if (roomId) {
        removeActiveUser(roomId, socket.id);
        socketRooms.delete(socket.id);
      }

      socketUsers.delete(socket.id);

      if (awarenessClient) {
        const { roomId, clientId } = awarenessClient;
        socket.to(roomId).emit("awareness-remove", { roomId, clientId });
        awarenessClients.delete(socket.id);
      }
    });


    socket.on("awareness-update", ({ roomId, clientId, update }: { roomId: string; clientId: number; update: number[] }) => {
      if (!inRoom(socket, roomId)) return;
      awarenessClients.set(socket.id, { roomId, clientId });
      socket.to(roomId).emit("awareness-update", { roomId, update });
    });

    // Timer

    socket.on("request-timer-state", (roomId: string) => {
      if (!inRoom(socket, roomId)) return;
      socket.emit("timer-state", getTimer(roomId));
    });

    socket.on("start-timer", (roomId: string) => {
      if (!inRoom(socket, roomId)) return;
      io.to(roomId).emit("timer-state", startTimer(roomId));
    });

    socket.on("pause-timer", (roomId: string) => {
      if (!inRoom(socket, roomId)) return;
      io.to(roomId).emit("timer-state", pauseTimer(roomId));
    });

    socket.on("reset-timer", (roomId: string) => {
      if (!inRoom(socket, roomId)) return;
      io.to(roomId).emit("timer-state", resetTimer(roomId));
    });

    // Language

    socket.on("set-language", (roomId: string, language: Language) => {
      if (!inRoom(socket, roomId)) return;
      if (!SUPPORTED_LANGUAGES.includes(language)) return;
      io.to(roomId).emit("language-state", setLanguage(roomId, language));
    });

    // Chat

    socket.on("send-chat-message", ({ roomId, message }: { roomId: string; message: string }) => {
      if (!inRoom(socket, roomId) || typeof message !== "string") return;

      const text = message.trim().slice(0, MAX_CHAT_LENGTH);
      if (!text) return;

      const sender = getActiveUsers(roomId).find((u) => u.socketId === socket.id);
      if (!sender) return;

      const chatMessage: ChatMessage = {
        id: `${socket.id}-${Date.now()}`,
        roomId,
        user: { name: sender.name, color: sender.color },
        message: text,
        timestamp: Date.now()
      }

      io.to(roomId).emit("chat-message", chatMessage);
    })

    // Interviewer Mode

    socket.on("request-interviewer-mode", ({ roomId, enabled }: { roomId: string; enabled: boolean }) => {
      if (!inRoom(socket, roomId)) return;

      const userId = socketUsers.get(socket.id);
      if (!userId || !isInterviewer(roomId, userId)) return;

      io.to(roomId).emit("interviewer-mode-state", setInterviewerMode(roomId, Boolean(enabled)));
    });

    socket.on("request-interviewer-mode-state", (roomId: string) => {
      if (!inRoom(socket, roomId)) return;
      socket.emit("interviewer-mode-state", getInterviewerMode(roomId));
    });

  });

  return io;
}

export function getSocketServer() {
  if (!ioInstance) {
    throw new Error("Socket.IO server has not been initialized");
  }

  return ioInstance
}