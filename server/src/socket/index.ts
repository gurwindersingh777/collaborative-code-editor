import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

import { registerRoomHandlers } from "./handlers/room.js";
import { registerSyncHandlers } from "./handlers/sync.js";
import { registerTimerHandlers } from "./handlers/timer.js";
import { registerLanguageHandlers } from "./handlers/language.js";
import { registerChatHandlers } from "./handlers/chat.js";
import { registerInterviewerModeHandlers } from "./handlers/interviewerMode.js";
import { config } from "../config/config.js";

let ioInstance: Server | null = null;

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.clientUrl },
    transports: ["websocket"],   
    maxHttpBufferSize: 5e6,      
    pingInterval: 25_000,
    pingTimeout: 60_000,        
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    registerRoomHandlers(io, socket);
    registerSyncHandlers(socket);
    registerTimerHandlers(io, socket);
    registerLanguageHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerInterviewerModeHandlers(io, socket);
  });

  return io;
}

export function getSocketServer() {
  if (!ioInstance) {
    throw new Error("Socket.IO server has not been initialized");
  }
  return ioInstance;
}