export type InterviewRole = "interviewer" | "candidate";

export type PresenceUser = { socketId: string; name: string; color: string };

export type ChatMessage = {
  id: string;
  roomId: string;
  user: { name: string; color: string };
  message: string;
  timestamp: number;
};

export type TimerState = {
  running: boolean;
  startedAt: number | null; // server clock, ms
  elapsed: number;          // ms accumulated before the current run
  serverNow?: number;       // server clock when this was sent
};

export type ExecutionResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  message?: string;
  status?: string;
};