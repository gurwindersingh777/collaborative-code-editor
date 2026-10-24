"use client";

import { useEffect, useState } from "react";
import LandingScreen from "@/components/LandingScreen";
import RoomView from "@/components/RoomView";
import { useLocalUser } from "@/hooks/useLocalUser";
import { generateRoomId } from "@/lib/room";
import { createHostToken } from "@/lib/hostToken";


export default function Home() {
  const [roomId, setRoomId] = useState<string | null | undefined>(undefined);
  const { user, rename } = useLocalUser();

  useEffect(() => {
    setRoomId(new URLSearchParams(window.location.search).get("room"));
  }, []);

  function handleCreateRoom() {
    const newRoomId = generateRoomId();
    createHostToken(newRoomId);
    window.history.pushState({}, "", `/?room=${newRoomId}`);
    setRoomId(newRoomId);
  }

  if (roomId === undefined) return null;
  if (!roomId) return <LandingScreen onCreateRoom={handleCreateRoom} />;

  if (!user) {
    return (
      <main className="flex h-screen items-center justify-center text-xs text-vs-muted">
        Preparing your session...
      </main>
    );
  }

  return <RoomView roomId={roomId} user={user} onRename={rename} />;
}