import { Request, Response, Router } from "express";
import { executeCode } from "../services/piston.js";

const executeRouter = Router();

const SUPPORTED_LANGUAGES = ["javascript", "python"] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

executeRouter.post("/execute", async (req: Request, res: Response) => {
  try {
    const { language, code } = req.body;

    // validate language
    if (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // validate code
    if (typeof code !== "string") {
      return res.status(400).json({ error: "Code must be a string" });
    }

    const result = await executeCode(language as SupportedLanguage, code);

    const run = result.run;

    if (!run) {
      return res.status(500).json({ error: "Piston did not return an execution result" });
    }

    return res.status(200).json({
      success: run.code === 0,
      stdout: run.stdout,
      stderr: run.stderr,
      exitCode: run.code,
      signal: run.signal,
    });
  } catch (error) {
    console.error("Code execution error:", error);
    return res.status(500).json({ error: "Code execution service unavailable" });
  }
})

export default executeRouter;