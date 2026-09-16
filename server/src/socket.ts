import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

export function createSocketServer(httpServer: HttpServer) {

  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL ?? "http://localhost:3000" }
  })

  io.on("connection", (socket) => {
    console.log(`Socket connection: ${socket.id}`);

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
      socket.to(roomId).emit("user-joined", { socketId: socket.id })
    })

    socket.on("code-change", ({ roomId, code }: { roomId: string; code: string }) => {
      socket.to(roomId).emit("code-change", { code })
    })

    socket.on("leave-room", (roomId: string) => {
      socket.leave(roomId);
      console.log(`${socket.id} left room ${roomId}`);
    })

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    })

  })

  return io;
}