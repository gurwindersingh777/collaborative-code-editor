import { Request, Response, Router } from "express";
import { executeCode } from "../services/piston.js";
import { getSocketServer } from "../socket.js";
import type { ExecutionResult } from "../types/execution.js";

const executeRouter = Router();

const SUPPORTED_LANGUAGES = ["javascript", "python"] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

executeRouter.post("/execute", async (req: Request, res: Response) => {
  try {
    const { roomId, language, code } = req.body;

    if (typeof roomId !== "string" || !roomId.trim()) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    if (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    if (typeof code !== "string") {
      return res.status(400).json({ error: "Code must be a string" });
    }

    // Send code to Piston
    const result = await executeCode(language as SupportedLanguage, code);

    const run = result.run;

    if (!run) {
      return res.status(500).json({ error: "Piston did not return an execution result" });
    }

    let message = run.message ?? undefined;

    switch (run.status) {
      case "TO":
        message = run.message ?? "Time limit exceeded.";
        break;

      case "OL":
        message = "Output limit exceeded.";
        break;

      case "EL":
        message = "Error output limit exceeded.";
        break;

      case "SG":
        message = "Program was terminated by the sandbox.";
        break;

      case "XX":
        message = "Piston encountered an internal execution error.";
        break;
    }

    const executionResult: ExecutionResult = {
      success: run.code === 0,
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: run.code,
      signal: run.signal,
      message,
      status: run.status ?? undefined,
    };

    // Broadcast the result to everyone in the room
    const io = getSocketServer();
    io.to(roomId).emit("execution-result", executionResult);

    // return the result to the HTTP caller
    return res.status(200).json(executionResult);

  } catch (error) {
    console.error("Code execution error:", error);
    return res.status(500).json({ error: "Code execution service unavailable" });
  }
});

export default executeRouter;