import { useEffect, useState } from "react";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness.js";
import { socket } from "@/lib/socket";
import { createYjsDocument } from "@/lib/yjs";
import { setupYjsSync } from "@/lib/yjsSync";
import { setupAwarenessSync } from "@/lib/yjsAwareness";
import { setupAwareness, type LocalUser } from "@/lib/presence";

export type YjsRoom = { ytext: Y.Text; problem: Y.Text; awareness: Awareness };

export function useYjsRoom(roomId: string, user: LocalUser): YjsRoom | null {
  const [yjsRoom, setYjsRoom] = useState<YjsRoom | null>(null);

  useEffect(() => {
    const { ydoc, ytext, problem, awareness } = createYjsDocument();
    setYjsRoom({ ytext, problem, awareness });

    const stopSync = setupYjsSync(socket, roomId, ydoc);
    const stopAwareness = setupAwarenessSync(socket, roomId, awareness);
    setupAwareness(awareness, user);

    return () => {
      stopSync();
      stopAwareness();
      awareness.destroy();
      ydoc.destroy();
      setYjsRoom(null);
    };
  }, [roomId, user]);

  return yjsRoom;
}