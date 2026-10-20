import { useCallback, useEffect, useState } from "react";
import type * as Y from "yjs";
import { socket } from "@/lib/socket";
import { API_URL } from "@/lib/config";
import { formatExecutionResult } from "@/lib/execution";
import type { Language } from "@/lib/languages";
import type { ExecutionResult } from "@/types/room";

export function useCodeExecution(roomId: string, language: Language, ytext: Y.Text | null) {
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    function handleResult(result: ExecutionResult) {
      setIsRunning(false);
      setOutput(formatExecutionResult(result));
    }

    socket.on("execution-result", handleResult);
    return () => { socket.off("execution-result", handleResult); };
  }, []);

  const run = useCallback(async () => {
    if (!ytext) {
      setOutput("Editor is not ready.");
      return;
    }

    const code = ytext.toString();
    if (!code.trim()) {
      setOutput("Nothing to execute.");
      return;
    }

    setOutput("Running...");
    setIsRunning(true);

    try {
      const response = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, language, code }),
      });
      const result = await response.json();

      setIsRunning(false);
      setOutput(response.ok ? formatExecutionResult(result) : result.error || "Execution request failed.");
    } catch {
      setIsRunning(false);
      setOutput("Unable to connect to execution service.");
    }
  }, [roomId, language, ytext]);

  return { output, isRunning, run };
}