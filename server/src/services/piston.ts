type SupportedLanguage = "javascript" | "python";

interface PistonResult {
  run?: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
  };
}

const PISTON_URL = "http://localhost:2000";

const RUNTIME_VERSIONS: Record<SupportedLanguage, string> = {
  javascript: "20.11.1",
  python: "3.12.0",
};

// {
//   "language": "javascript",
//   "version": "20.11.1",
//   "files": [
//     {
//       "name": "main.js",
//       "content": "console.log(\"Hello\")"
//     }
//   ]
// }

export async function executeCode(language: SupportedLanguage, code: string): Promise<PistonResult> {
  const response = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language,
      version: RUNTIME_VERSIONS[language],
      files: [{
        name: language === "javascript" ? "main.js" : "main.py",
        content: code,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Piston returned HTTP ${response.status}`);
  }

  return response.json() as Promise<PistonResult>;
}