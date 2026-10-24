import { useState } from "react";
import SessionTimer from "./SessionTimer";
import { LANGUAGES, type Language } from "@/lib/languages";
import type { InterviewRole, PresenceUser } from "@/types/room";
import OnlineDots from "./OnlineDots";

type RoomHeaderProps = {
  roomId: string;
  role: InterviewRole | null;
  interviewerMode: boolean;
  onInterviewerModeChange: (enabled: boolean) => void;
  locked: boolean;
  connected: boolean;
  language: Language;
  onLanguageChange: (language: Language) => void;
  isRunning: boolean;
  onRun: () => void;
  users: PresenceUser[];
  selfId: string | null;
};

export default function RoomHeader({
  roomId, role, interviewerMode, onInterviewerModeChange, locked,
  users, selfId,
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
    <header className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-vs-line bg-vs-side px-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="font-semibold tracking-tight text-white">Code Room</span>
        <span className="h-4 w-px bg-vs-line" aria-hidden="true" />
        <span className="text-vs-muted">Room</span>
        <span className="font-mono text-vs-fg">{roomId}</span>
        <button onClick={handleCopyLink} className="btn">{copied ? "Copied" : "Copy link"}</button>
      </div>

      <div className="flex items-center gap-3">
        {role === "interviewer" && (
          <label
            className="flex cursor-pointer items-center gap-1.5"
            title="Others can still read, chat and run code, but cannot edit"
          >
            <input
              type="checkbox"
              checked={interviewerMode}
              onChange={(event) => onInterviewerModeChange(event.target.checked)}
              className="accent-vs-accent"
            />
            Lock editing
          </label>
        )}

        {locked && <span className="text-amber-400">Editing locked by host</span>}

        <SessionTimer roomId={roomId} />
      </div>

      <div className="flex items-center gap-3">
        <OnlineDots users={users} selfId={selfId} />

        <span className="flex items-center gap-1.5 text-vs-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "animate-pulse bg-amber-400"
              }`}
          />
          {connected ? "Connected" : "Connecting..."}
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
