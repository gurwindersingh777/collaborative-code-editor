"use client";

import CodeEditor from "@/components/CodeEditor";
import { useState } from "react";

const DEFAULT_CODE = {
  javascript: `function solve() {
  console.log("Hello, collaborative editor!");
}

solve();
`,
  python: `def solve():
    print("Hello, collaborative editor!")

solve()
`,
};

type Language = keyof typeof DEFAULT_CODE;

export default function Home() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [output, setOutput] = useState("");

  function handleLanguageChange(newLanguage: Language) {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage]);
    setOutput("");
  }

  function handleRun() {
    console.log("Code submitted for execution:", code);

    setOutput("Code sent to execution service.");
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">Collaborative Code Editor</h1>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(event) => handleLanguageChange(event.target.value as Language)}
            className="rounded border px-3 py-2"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>

          <button onClick={handleRun} className="rounded border px-4 py-2">Run</button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-2">
        <div className="min-h-0">
          <CodeEditor value={code} language={language} onChange={setCode} />
        </div>

        <div className="border-l p-4">
          <h2 className="mb-3 font-semibold">Output</h2>
          <pre className="whitespace-pre-wrap text-sm">{output || "Output will appear here."}</pre>
        </div>
      </section>
    </main>
  );
}