"use client";

import CodeEditor from "@/components/CodeEditor";
import { socket } from "@/lib/socket";
import { useEffect, useRef, useState } from "react";

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
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const applyingRemoteChange = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const room = params.get("room")

    setRoomId(room || "demo-room");
  }, [])

  useEffect(() => {
    if (!roomId) return;

    socket.connect();

    function handleConnect() { setConnected(true) }

    function handleDisconnect() { setConnected(false) }

    function handleCodeChange({ code }: { code: string }) {
      applyingRemoteChange.current = true;
      setCode(code);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("code-change", handleCodeChange);
    socket.emit("join-room", roomId);

    return () => {
      socket.emit("leave-room", roomId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("code-change", handleCodeChange);
      socket.disconnect();
    };
  }, [roomId]);

  function handleLanguageChange(newLanguage: Language) {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage]);
    setOutput("");
  }

  function handleRun() {
    console.log("Code submitted for execution:", code);
    setOutput("Code sent to execution service.");
  }

  function handleCodeChange(value: string) {
    setCode(value)

    if (applyingRemoteChange.current) {
      applyingRemoteChange.current = false
      return
    }
    if (!roomId) return;

    socket.emit("code-change", {
      roomId,
      code: value
    })
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">Collaborative Code Editor</h1>
        {roomId && (<span className="text-sm text-gray-500">Room: {roomId}</span>)}
        <span className="text-sm">{connected ? "Connected" : "Disconnected"}</span>

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
          <CodeEditor value={code} language={language} onChange={handleCodeChange} />
        </div>

        <div className="border-l p-4">
          <h2 className="mb-3 font-semibold">Output</h2>
          <pre className="whitespace-pre-wrap text-sm">{output || "Output will appear here."}</pre>
        </div>
      </section>
    </main>
  );
}