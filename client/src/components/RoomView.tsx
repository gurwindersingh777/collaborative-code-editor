import { useState } from "react";
import CodeEditor from "./CodeEditor";
import RoomHeader from "./RoomHeader";
import SidePanel, { type SideTab } from "./SidePanel";
import { useCodeExecution } from "@/hooks/useCodeExecution";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useRoomState } from "@/hooks/useRoomState";
import { useYjsRoom } from "@/hooks/useYjsRoom";
import { socket } from "@/lib/socket";
import type { LocalUser } from "@/lib/presence";

type RoomViewProps = {
  roomId: string;
  user: LocalUser;
  onRename: (name: string) => void;
};

export default function RoomView({ roomId, user, onRename }: RoomViewProps) {
  const [activeTab, setActiveTab] = useState<SideTab>("problem");

  const yjsRoom = useYjsRoom(roomId, user.color);
  const room = useRoomState(roomId);
  const execution = useCodeExecution(roomId, room.language, yjsRoom?.ytext ?? null);
  const connection = useRoomConnection(roomId, user);

  function handleRun() {
    setActiveTab("output");
    void execution.run();
  }

  function handleRename(name: string) {
    onRename(name);                                 
    socket.emit("rename-user", { roomId, name });   
  }

  return (
    <main className="flex min-h-screen flex-col overflow-hidden">
      <RoomHeader
        roomId={roomId}
        role={room.role}
        interviewerMode={room.interviewerMode}
        onInterviewerModeChange={room.changeInterviewerMode}
        locked={room.isLocked}
        users={room.onlineUsers}          
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

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_24rem] max-md:grid-rows-[minmax(0,1fr)_minmax(15rem,42vh)] max-md:grid-cols-1">
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
          users={room.onlineUsers}
          selfId={connection.socketId}
          onRename={handleRename}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </main>
  );
}
