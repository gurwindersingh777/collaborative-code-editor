import { useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import RoomHeader from "./RoomHeader";
import SidePanel, { type SideTab } from "./SidePanel";
import { useCodeExecution } from "@/hooks/useCodeExecution";
import { useRoomConnection } from "@/hooks/useRoomConnection";
import { useRoomState } from "@/hooks/useRoomState";
import { useYjsRoom } from "@/hooks/useYjsRoom";
import { socket } from "@/lib/socket";
import type { LocalUser } from "@/lib/presence";
import { applyTextDiff } from "@/lib/yjsText";
import { Language } from "@/lib/languages";
import { STARTERS, isUntouchedStarter } from "@/lib/starters";

type RoomViewProps = {
  roomId: string;
  user: LocalUser;
  onRename: (name: string) => void;
};

export default function RoomView({ roomId, user, onRename }: RoomViewProps) {
  const [activeTab, setActiveTab] = useState<SideTab>("problem");

  const yjsRoom = useYjsRoom(roomId, user.color);
  const room = useRoomState(roomId);
  const execution = useCodeExecution(roomId);
  const connection = useRoomConnection(roomId, user);
  const starterAdded = useRef(false);
  
  useEffect(() => {
    if (starterAdded.current || !yjsRoom?.synced || room.role !== "interviewer") return;
    starterAdded.current = true;
    if (yjsRoom.ytext.length === 0) applyTextDiff(yjsRoom.ytext, STARTERS[room.language]);
  }, [yjsRoom, room.role, room.language]);

  function handleRun() {
    setActiveTab("output");
    execution.run();
  }

  function handleRename(name: string) {
    onRename(name);
    socket.emit("rename-user", { roomId, name });
  }

  function handleLanguageChange(next: Language) {
    const code = yjsRoom?.ytext;

    if (code && room.role === "interviewer" && !room.isLocked) {
      const current = code.toString();
      if (current.trim() === "" || isUntouchedStarter(current)) {
        applyTextDiff(code, STARTERS[next]);
      }
    }

    room.changeLanguage(next);
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
        onLanguageChange={handleLanguageChange}
        isRunning={execution.isRunning}
        onRun={handleRun}
      />

      {connection.joinError && (
        <div role="alert" className="shrink-0 bg-red-900/40 px-3 py-1 text-xs text-red-300">
          Could not join this room. Refresh to try again.
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_22rem] max-md:grid-rows-[minmax(0,1fr)_minmax(15rem,42vh)] max-md:grid-cols-1">
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