import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import * as Y from "yjs";
import { getRoomDocument } from "../src/yjs/roomDocuments.js";
import { addActiveUser, getActiveUsers, removeActiveUser } from "./rooms/activeUsers.js";

const awarenessClients = new Map<string, { roomId: string; clientId: number }>();
const socketRooms = new Map<string, string>();

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connection: ${socket.id}`);

    socket.on("join-room", ({ roomId, user }: { roomId: string; user: { name: string; color: string } }) => {
      socket.join(roomId);
      socketRooms.set(socket.id, roomId);

      addActiveUser(roomId, {
        socketId: socket.id,
        name: user.name,
        color: user.color
      })

      const ydoc = getRoomDocument(roomId);
      const state = Y.encodeStateAsUpdate(ydoc);

      socket.emit("yjs-sync", { roomId: roomId, update: Array.from(state) });

      console.log(`${socket.id} joined room ${roomId}`);
      // Temp
      console.log("Active users:", getActiveUsers(roomId));

      socket.to(roomId).emit("user-joined", { socketId: socket.id });
      socket.to(roomId).emit("awareness-request", { roomId: roomId });
    });


    socket.on("code-change", ({ roomId, code }: { roomId: string; code: string }) => {
      socket.to(roomId).emit("code-change", { code });
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

      console.log("Active users:", getActiveUsers(roomId));
      console.log(`${socket.id} left room ${roomId}`);
    });


    socket.on("disconnect", () => {
      const roomId = socketRooms.get(socket.id);
      const awarenessClient = awarenessClients.get(socket.id);

      if (roomId) {
        removeActiveUser(roomId, socket.id);
        socketRooms.delete(socket.id);
        console.log("Active users:", getActiveUsers(roomId));
      }

      if (awarenessClient) {
        const { roomId, clientId } = awarenessClient;
        socket.to(roomId).emit("awareness-remove", { roomId, clientId })
        awarenessClients.delete(socket.id)
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });


    socket.on("awareness-update", ({ roomId, clientId, update }: { roomId: string; clientId: number; update: number[] }) => {
      awarenessClients.set(socket.id, { roomId, clientId });
      socket.to(roomId).emit("awareness-update", { roomId, update });
    });

  });

  return io;
}