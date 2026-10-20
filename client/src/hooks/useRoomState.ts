import { useCallback, useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import type { Language } from "@/lib/languages";
import type { InterviewRole, PresenceUser } from "@/types/room";

export function useRoomState(roomId: string) {
  const [language, setLanguage] = useState<Language>("javascript");
  const [role, setRole] = useState<InterviewRole | null>(null);
  const [interviewerMode, setInterviewerMode] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    function handlePresence(data: { roomId: string; users: PresenceUser[] }) {
      if (data.roomId === roomId) setOnlineUsers(data.users);
    }

    function clearUsers() { setOnlineUsers([]); }

    socket.on("language-state", setLanguage);
    socket.on("interview-role", setRole);
    socket.on("interviewer-mode-state", setInterviewerMode);
    socket.on("presence-state", handlePresence);
    socket.on("disconnect", clearUsers);

    return () => {
      socket.off("language-state", setLanguage);
      socket.off("interview-role", setRole);
      socket.off("interviewer-mode-state", setInterviewerMode);
      socket.off("presence-state", handlePresence);
      socket.off("disconnect", clearUsers);
    };
  }, [roomId]);

  const changeLanguage = useCallback(
    (next: Language) => { socket.emit("set-language", roomId, next); },
    [roomId],
  );

  const changeInterviewerMode = useCallback(
    (enabled: boolean) => {
      if (role !== "interviewer") return;
      socket.emit("request-interviewer-mode", { roomId, enabled });
    },
    [roomId, role],
  );

  return {
    language,
    role,
    interviewerMode,
    isLocked: interviewerMode && role !== "interviewer",
    onlineUsers,
    changeLanguage,
    changeInterviewerMode,
  };
}