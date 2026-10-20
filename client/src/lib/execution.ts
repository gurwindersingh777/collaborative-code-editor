import type { ExecutionResult } from "@/types/room";

export function formatExecutionResult(result: ExecutionResult): string {
  if (result.success) return result.stdout || "Program finished successfully.";
  if (result.status === "TO") return `Execution timed out.\n\n${result.message || "Time limit exceeded."}`;
  if (result.status === "OL") return result.message || "Output limit exceeded.";
  if (result.status === "EL") return result.message || "Error output limit exceeded.";

  return [result.stdout, result.stderr || result.message || "Program exited with an error."]
    .filter(Boolean)
    .join("\n");
}