type SupportedLanguage = "javascript" | "python";

interface PistonResult {
  run?: {
    stdout: string;
    stderr: string;
    output?: string;
    code: number | null;
    signal: string | null;
    message?: string | null;
    status?: string | null;
    memory?: number;
    cpu_time?: number;
    wall_time?: number;
  };

  compile?: {
    stdout: string;
    stderr: string;
    output?: string;
    code: number | null;
    signal: string | null;
    message?: string | null;
    status?: string | null;
    memory?: number;
    cpu_time?: number;
    wall_time?: number;
  };
}

const PISTON_URL = process.env.PISTON_URL ?? "http://localhost:2000";

const RUNTIME_VERSIONS: Record<SupportedLanguage, string> = {
  javascript: "20.11.1",
  python: "3.12.0",
};

export async function executeCode(language: SupportedLanguage, code: string): Promise<PistonResult> {
  const response = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language,
      version: RUNTIME_VERSIONS[language],
      files: [
        {
          name: language === "javascript" ? "main.js" : "main.py",
          content: code,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Piston error response:", errorBody);
    throw new Error(`Piston returned HTTP ${response.status}`);
  }

  return response.json() as Promise<PistonResult>;
}