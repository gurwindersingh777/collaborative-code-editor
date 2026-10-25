import { useState } from "react";
import SessionTimer from "./SessionTimer";
import { LANGUAGES, type Language } from "@/lib/languages";
import type { InterviewRole, PresenceUser } from "@/types/room";
import OnlineDots from "./OnlineDots";
import { Check, Clipboard, LockKeyhole, Play } from "lucide-react";
import { APP_NAME } from "@/lib/config";
import { ConnectionStatus } from "@/hooks/useRoomConnection";

type RoomHeaderProps = {
  roomId: string;
  role: InterviewRole | null;
  interviewerMode: boolean;
  onInterviewerModeChange: (enabled: boolean) => void;
  locked: boolean;
  status: ConnectionStatus;
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
  status, language, onLanguageChange, isRunning, onRun,
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
      <div className="flex items-center gap-1">
        <span className="font-semibold text-white">{APP_NAME}</span>
        <span className="h-4 w-px bg-vs-line ml-2.5" aria-hidden="true" />
        <button onClick={handleCopyLink} className="btn gap-1.5" aria-label={copied ? "Link copied" : "Copy room link"}>
          {copied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        {role === "interviewer" && (
          <button
            type="button"
            onClick={() => onInterviewerModeChange(!interviewerMode)}
            aria-pressed={interviewerMode}
            aria-label="Lock editing"
            title="Lock editing: others can still read, chat and run code, but cannot edit"
            className={`btn ${interviewerMode
              ? "bg-amber-400/15 text-amber-400"
              : "text-vs-muted hover:text-white"
              }`}
          >
            <LockKeyhole data-icon="inline-start" />
          </button>
        )}

        {locked && role !== "interviewer" && (
          <span className="text-amber-400">Editing locked by host</span>
        )}

        <SessionTimer roomId={roomId} />
      </div>

      <div className="flex items-center gap-3">
        <OnlineDots users={users} selfId={selfId} />

        <span className="flex items-center gap-1.5 text-vs-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${status === "connected"
              ? "bg-emerald-500"
              : status === "failed"
                ? "bg-red-500"
                : "animate-pulse bg-amber-400"
              }`}
          />
          {status === "connected" ? "Connected" : status === "failed" ? "Could not join" : "Connecting..."}
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

        <button
          onClick={onRun}
          disabled={isRunning || status !== "connected"}
          className="btn btn-primary gap-1.5">
          <Play data-icon="inline-start" />
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>
    </header>
  );
}
