import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import { getHostToken } from "@/lib/hostToken";
import type { LocalUser } from "@/lib/presence";

export type ConnectionStatus = "connecting" | "connected" | "failed";

export function useRoomConnection(roomId: string, user: LocalUser) {
  const [ready, setReady] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    function handleConnect() {
      setReady(false);
      setJoinError(false);
      setSocketId(socket.id ?? null);

      const { id, name, color } = userRef.current;
      socket.emit("join-room", { roomId, user: { id, name, color }, hostToken: getHostToken(roomId) });
    }
    function handleDisconnect() { setReady(false); }
    function handleJoinError() { setJoinError(true); }
    function handleSync(data: { roomId: string }) {
      if (data.roomId === roomId) setReady(true);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("join-error", handleJoinError);
    socket.on("yjs-sync", handleSync);
    socket.connect();

    return () => {
      if (socket.connected) socket.emit("leave-room", roomId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("join-error", handleJoinError);
      socket.off("yjs-sync", handleSync);
      socket.disconnect();
    };
  }, [roomId, user.id]);

  const status: ConnectionStatus = joinError ? "failed" : ready ? "connected" : "connecting";

  return { status, joinError, socketId };
}