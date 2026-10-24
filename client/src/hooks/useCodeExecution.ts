import { useCallback, useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { formatExecutionResult } from "@/lib/execution";
import type { ExecutionResult } from "@/types/room";

type RunAck = { ok: boolean; error?: string };

export function useCodeExecution(roomId: string) {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    function handleStarted(data: { roomId: string }) {
      if (data.roomId !== roomId) return;
      setIsRunning(true);
      setOutput("Running...");
    }
    function handleResult(result: ExecutionResult) {
      setIsRunning(false);
      setOutput(formatExecutionResult(result));
    }
    function handleDisconnect() {
      setIsRunning(false);
    }

    socket.on("execution-started", handleStarted);
    socket.on("execution-result", handleResult);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("execution-started", handleStarted);
      socket.off("execution-result", handleResult);
      socket.off("disconnect", handleDisconnect);
    };
  }, [roomId]);

  const run = useCallback(() => {
    setIsRunning(true);
    setOutput("Running...");

    socket.timeout(10_000).emit("run-code", { roomId }, (error: Error | null, response?: RunAck) => {
      if (error) {
        setIsRunning(false);
        setOutput("The server did not respond. Check your connection.");
      } else if (response && !response.ok) {
        setIsRunning(false);
        setOutput(response.error ?? "Could not run the code.");
      }
    });
  }, [roomId]);

  return { output, isRunning, run };
}