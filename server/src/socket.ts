import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import * as Y from "yjs";
import { getRoomDocument } from "../src/yjs/roomDocuments.js";
import { addActiveUser, getActiveUsers, removeActiveUser } from "./rooms/activeUsers.js";
import { getTimer, pauseTimer, resetTimer, startTimer } from "./util/timer.js";
import { getLanguage, setLanguage } from "./util/language.js";
import { ChatMessage } from "./types/chat.js";
import { assignRole, isInterviewer, removeRole } from "./util/role.js";
import { getInterviewerMode, setInterviewerMode } from "./util/interviewerMode.js";

let ioInstance: Server | null = null;
const awarenessClients = new Map<string, { roomId: string; clientId: number }>();
const socketRooms = new Map<string, string>();
const socketUsers = new Map<string, string>();

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    },
  });

  ioInstance = io;

  io.on("connection", (socket) => {

    socket.on("join-room", ({ roomId, user }: { roomId: string; user: { id: string; name: string; color: string } }) => {
      socket.join(roomId);

      const role = assignRole(roomId, user.id, socket.id);

      socketRooms.set(socket.id, roomId);
      socketUsers.set(socket.id, user.id);

      socket.emit("interview-role", role);
      socket.emit("language-state", getLanguage(roomId));

      addActiveUser(roomId, {
        socketId: socket.id,
        name: user.name,
        color: user.color
      })

      const ydoc = getRoomDocument(roomId);
      const state = Y.encodeStateAsUpdate(ydoc);

      socket.emit("yjs-sync", { roomId: roomId, update: Array.from(state) });
      socket.to(roomId).emit("user-joined", { socketId: socket.id });
      socket.to(roomId).emit("awareness-request", { roomId: roomId });
    });


    socket.on("yjs-update", ({ roomId, update }: { roomId: string; update: number[] }) => {
      const ydoc = getRoomDocument(roomId);
      const uint8Update = new Uint8Array(update);

      Y.applyUpdate(ydoc, uint8Update, "remote");
      socket.to(roomId).emit("yjs-update", { roomId, update });
    });


    socket.on("leave-room", (roomId: string) => {
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
      awarenessClients.set(socket.id, { roomId, clientId });
      socket.to(roomId).emit("awareness-update", { roomId, update });
    });

    // Timer

    socket.on("request-timer-state", (roomId: string) => {
      socket.emit("timer-state", getTimer(roomId));
    });

    socket.on("start-timer", (roomId: string) => {
      const timer = startTimer(roomId);
      io.to(roomId).emit("timer-state", timer);
    });

    socket.on("pause-timer", (roomId: string) => {
      const timer = pauseTimer(roomId);
      io.to(roomId).emit("timer-state", timer);
    });

    socket.on("reset-timer", (roomId: string) => {
      const timer = resetTimer(roomId);
      io.to(roomId).emit("timer-state", timer);
    });

    // Language

    socket.on("set-language", (roomId: string, language: "javascript" | "python") => {
      const nextLanguage = setLanguage(roomId, language);
      io.to(roomId).emit("language-state", nextLanguage)
    })

    // Chat

    socket.on("send-chat-message", ({ roomId, message, user, }: {
      roomId: string; message: string; user: { name: string, color: string; };
    }) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;

      const chatMessage: ChatMessage = {
        id: `${socket.id}-${Date.now()}`,
        roomId,
        user,
        message: trimmedMessage,
        timestamp: Date.now()
      }

      io.to(roomId).emit("chat-message", chatMessage);
    })

    // Interviewer Mode

    socket.on("request-interviewer-mode", ({ roomId, enabled }: { roomId: string; enabled: boolean }) => {
      const userId = socketUsers.get(socket.id);

      if (!userId) return;
      if (!isInterviewer(roomId, userId)) return;

      const nextMode = setInterviewerMode(roomId, enabled);
      io.to(roomId).emit("interviewer-mode-state", nextMode);
    },
    );

    socket.on("request-interviewer-mode-state", (roomId: string) => {
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