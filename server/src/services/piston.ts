
import type { Language } from "../types/language.js";
import type { ExecutionResult } from "../types/execution.js";
import { config } from "../config/config.js";

export interface PistonStage {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  message?: string | null;
  status?: string | null;
}

export interface PistonResult {
  run?: PistonStage;
}

const RUNTIME_VERSIONS: Record<Language, string> = {
  javascript: "20.11.1",
  python: "3.10.0",
};

const FILE_NAMES: Record<Language, string> = {
  javascript: "main.js",
  python: "main.py",
};

export async function executeCode(language: Language, code: string): Promise<PistonResult> {
  const response = await fetch(`${config.pistonUrl}/api/v2/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.pistonKey ? { "X-Piston-Key": config.pistonKey } : {}),
    },
    body: JSON.stringify({
      language,
      version: RUNTIME_VERSIONS[language],
      files: [{ name: FILE_NAMES[language], content: code }],
    }),
  });

  if (!response.ok) {
    console.error("Piston error response:", await response.text());
    throw new Error(`Piston returned HTTP ${response.status}`);
  }

  return response.json() as Promise<PistonResult>;
}

function getStatusMessage(run: PistonStage): string | undefined {
  switch (run.status) {
    case "TO": return run.message ?? "Time limit exceeded.";
    case "OL": return "Output limit exceeded.";
    case "EL": return "Error output limit exceeded.";
    case "SG": return "Program was terminated by the sandbox.";
    case "XX": return "Piston encountered an internal execution error.";
    default: return run.message ?? undefined;
  }
}

export function toExecutionResult(run: PistonStage): ExecutionResult {
  return {
    success: run.code === 0,
    stdout: run.stdout,
    stderr: run.stderr,
    exitCode: run.code,
    signal: run.signal,
    message: getStatusMessage(run),
    status: run.status ?? undefined,
  };
}