import type { Server, Socket } from "socket.io";
import { executeCode, toExecutionResult } from "../../services/piston.js";
import { finishRun, tryStartRun } from "../../services/runLimiter.js";
import { getRoomDocument } from "../../yjs/roomDocuments.js";
import type { ExecutionResult } from "../../types/execution.js";
import { inRoom, onSafe } from "../helpers.js";
import { getLanguage } from "../rooms/language.js";
import { RunCodePayload } from "../../types/socket.js";

const MAX_CODE_LENGTH = 100_000;

type Ack = (response: { ok: boolean; error?: string }) => void;

function failure(message: string): ExecutionResult {
  return { success: false, stdout: "", stderr: "", exitCode: null, signal: null, message };
}

async function runInSandbox(roomId: string, code: string): Promise<ExecutionResult> {
  try {
    const result = toExecutionResult(await executeCode(getLanguage(roomId), code));
    return result ?? failure("Piston did not return an execution result.");
  } catch (error) {
    console.error("Code execution error:", error);
    return failure("Code execution service unavailable.");
  }
}

export function registerRunHandlers(io: Server, socket: Socket) {
  onSafe(socket, "run-code", async (payload: RunCodePayload, ack?: Ack) => {
    const reply: Ack = typeof ack === "function" ? ack : () => {};
    const roomId = payload?.roomId;

    if (!inRoom(socket, roomId)) return reply({ ok: false, error: "You are not in this room." });

    const code = (await getRoomDocument(roomId)).getText("code").toString();

    if (!code.trim()) return reply({ ok: false, error: "Nothing to execute." });
    if (code.length > MAX_CODE_LENGTH) {
      return reply({ ok: false, error: `Code is too long to run (max ${MAX_CODE_LENGTH} characters).` });
    }

    const refusal = tryStartRun(roomId, socket.id);
    if (refusal) return reply({ ok: false, error: refusal });

    reply({ ok: true });
    io.to(roomId).emit("execution-started", { roomId });

    const result = await runInSandbox(roomId, code);
    finishRun(roomId);

    io.to(roomId).emit("execution-result", result);
  });
}