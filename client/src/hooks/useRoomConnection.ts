import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import type { LocalUser } from "@/lib/presence";

export function useRoomConnection(roomId: string, user: LocalUser) {
  const [connected, setConnected] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    function handleConnect() {
      setConnected(true);
      setJoinError(false);
      setSocketId(socket.id ?? null);

      const { id, name, color } = userRef.current;
      socket.emit("join-room", { roomId, user: { id, name, color } });
    }
    function handleDisconnect() { setConnected(false); }
    function handleJoinError() { setJoinError(true); }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("join-error", handleJoinError);
    socket.connect();

    return () => {
      if (socket.connected) socket.emit("leave-room", roomId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("join-error", handleJoinError);
      socket.disconnect();
    };
  }, [roomId, user.id]);

  return { connected, joinError, socketId };
}