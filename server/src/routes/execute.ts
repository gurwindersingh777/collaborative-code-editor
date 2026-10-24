import { Router, type Request, type Response } from "express";
import { executeCode, toExecutionResult } from "../services/piston.js";

import { isLanguage } from "../types/language.js";
import { getSocketServer } from "../socket/index.js";

const executeRouter = Router();

executeRouter.post("/execute", async (req: Request, res: Response) => {
  try {
    const { roomId, language, code } = req.body;

    if (typeof roomId !== "string" || !roomId.trim()) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    if (!isLanguage(language)) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    if (typeof code !== "string") {
      return res.status(400).json({ error: "Code must be a string" });
    }

    const executionResult = toExecutionResult(await executeCode(language, code));

    if (!executionResult) {
      return res.status(500).json({ error: "Piston did not return an execution result" });
    }
    
    getSocketServer().to(roomId).emit("execution-result", executionResult);
    return res.status(200).json(executionResult);

  } catch (error) {
    console.error("Code execution error:", error);
    return res.status(500).json({ error: "Code execution service unavailable" });
  }
});

export default executeRouter;