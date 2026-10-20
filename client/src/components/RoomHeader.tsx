import { useState } from "react";
import OnlineUsers from "./OnlineUsers";
import SessionTimer from "./SessionTimer";
import { LANGUAGES, type Language } from "@/lib/languages";
import type { InterviewRole, PresenceUser } from "@/types/room";

type RoomHeaderProps = {
  roomId: string;
  role: InterviewRole | null;
  interviewerMode: boolean;
  onInterviewerModeChange: (enabled: boolean) => void;
  onlineUsers: PresenceUser[];
  selfId: string | null;
  connected: boolean;
  language: Language;
  onLanguageChange: (language: Language) => void;
  isRunning: boolean;
  onRun: () => void;
};

export default function RoomHeader({
  roomId, role, interviewerMode, onInterviewerModeChange, onlineUsers, selfId,
  connected, language, onLanguageChange, isRunning, onRun,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { }
  }

  return (
    <header className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-vs-line bg-vs-side px-3 py-1 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-vs-muted">Room</span>
        <span className="font-mono">{roomId}</span>
        <button onClick={handleCopyLink} className="btn">{copied ? "Copied" : "Copy link"}</button>
      </div>

      <div className="flex items-center gap-3">
        {role && (
          <span className="text-vs-muted">{role === "interviewer" ? "Interviewer" : "Candidate"}</span>
        )}

        {role === "interviewer" && (
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={interviewerMode}
              onChange={(event) => onInterviewerModeChange(event.target.checked)}
              className="accent-vs-accent"
            />
            Interviewer mode
          </label>
        )}

        <SessionTimer roomId={roomId} />
      </div>

      <div className="flex items-center gap-3">
        <OnlineUsers users={onlineUsers} selfId={selfId} />

        <span className="flex items-center gap-1.5 text-vs-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
          {connected ? "Connected" : "Disconnected"}
        </span>

        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as Language)}
          className="field"
        >
          {LANGUAGES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>

        <button onClick={onRun} disabled={isRunning} className="btn btn-primary">
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </header>
  );
}