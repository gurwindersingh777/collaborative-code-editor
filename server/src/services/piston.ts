import { LANGUAGE_CONFIG, type Language } from "../types/language.js";
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
  compile?: PistonStage; 
  run?: PistonStage;     
}

export async function executeCode(language: Language, code: string): Promise<PistonResult> {
  const { piston, file } = LANGUAGE_CONFIG[language];

  const response = await fetch(`${config.pistonUrl}/api/v2/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.pistonKey ? { "X-Piston-Key": config.pistonKey } : {}),
    },
    body: JSON.stringify({
      language: piston,
      version: "*", 
      files: [{ name: file, content: code }],
    }),
  });

  if (!response.ok) {
    console.error("Piston error response:", await response.text());
    throw new Error(`Piston returned HTTP ${response.status}`);
  }

  return response.json() as Promise<PistonResult>;
}

function getStatusMessage(stage: PistonStage): string | undefined {
  switch (stage.status) {
    case "TO": return stage.message ?? "Time limit exceeded.";
    case "OL": return "Output limit exceeded.";
    case "EL": return "Error output limit exceeded.";
    case "SG": return "Program was terminated by the sandbox.";
    case "XX": return "Piston encountered an internal execution error.";
    default: return stage.message ?? undefined;
  }
}

export function toExecutionResult({ compile, run }: PistonResult): ExecutionResult | null {
  if (compile && compile.code !== 0) {
    return {
      success: false,
      stdout: "",
      stderr: compile.stderr || compile.stdout,
      exitCode: compile.code,
      signal: compile.signal,
      message: getStatusMessage(compile) ?? "Compilation failed.",
      status: "CE",
    };
  }

  if (!run) return null;

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