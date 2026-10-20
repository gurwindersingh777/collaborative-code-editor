import { useState } from "react";
import CodeEditor from "./CodeEditor";

import { useCodeExecution } from "@/hooks/useCodeExecution";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useRoomState } from "@/hooks/useRoomState";
import { useYjsRoom } from "@/hooks/useYjsRoom";
import type { LocalUser } from "@/lib/presence";
import RoomHeader from "./RoomHeader";
import SidePanel, { SideTab } from "./SidePanel";

type RoomViewProps = { roomId: string; user: LocalUser };

export default function RoomView({ roomId, user }: RoomViewProps) {
  const [activeTab, setActiveTab] = useState<SideTab>("problem");
  const yjsRoom = useYjsRoom(roomId, user);
  const room = useRoomState(roomId);
  const execution = useCodeExecution(roomId, room.language, yjsRoom?.ytext ?? null);
  const connection = useRoomConnection(roomId, user);

  function handleRun() {
    setActiveTab("output");
    void execution.run();
  }

  return (
    <main className="flex h-screen flex-col">
      <RoomHeader
        roomId={roomId}
        role={room.role}
        interviewerMode={room.interviewerMode}
        onInterviewerModeChange={room.changeInterviewerMode}
        onlineUsers={room.onlineUsers}
        selfId={connection.socketId}
        connected={connection.connected}
        language={room.language}
        onLanguageChange={room.changeLanguage}
        isRunning={execution.isRunning}
        onRun={handleRun}
      />

      {connection.joinError && (
        <div role="alert" className="shrink-0 bg-red-900/40 px-3 py-1 text-xs text-red-300">
          Could not join this room. Refresh to try again.
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_24rem]">
        <div className="h-full min-h-0 min-w-0">
          {yjsRoom && (
            <CodeEditor
              language={room.language}
              ytext={yjsRoom.ytext}
              awareness={yjsRoom.awareness}
              isReadOnly={room.isLocked}
            />
          )}
        </div>

        <SidePanel
          roomId={roomId}
          problem={yjsRoom?.problem ?? null}
          locked={room.isLocked}
          output={execution.output}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </main>
  );
}