import { useEffect, useMemo, useState } from "react";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness.js";
import { socket } from "@/lib/socket";
import { createYjsDocument } from "@/lib/yjs";
import { setupYjsSync } from "@/lib/yjsSync";
import { setupAwarenessSync } from "@/lib/yjsAwareness";
import { setupAwareness } from "@/lib/presence";

export type YjsRoom = {
  ytext: Y.Text;
  problem: Y.Text;
  awareness: Awareness;
  synced: boolean; 
};

export function useYjsRoom(roomId: string, color: string): YjsRoom | null {
  const [parts, setParts] = useState<Omit<YjsRoom, "synced"> | null>(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const { ydoc, ytext, problem, awareness } = createYjsDocument();
    setParts({ ytext, problem, awareness });

    const stopSync = setupYjsSync(socket, roomId, ydoc, () => setSynced(true));
    const stopAwareness = setupAwarenessSync(socket, roomId, awareness);
    setupAwareness(awareness, color);

    return () => {
      stopSync();
      stopAwareness();
      awareness.destroy();
      ydoc.destroy();
      setParts(null);
      setSynced(false);
    };
  }, [roomId, color]);

  return useMemo(() => (parts ? { ...parts, synced } : null), [parts, synced]);
}