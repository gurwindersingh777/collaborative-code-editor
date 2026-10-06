"use client";

import CodeEditor from "@/components/CodeEditor";
import { socket } from "@/lib/socket";
import { createYjsDocument } from "@/lib/yjs";
import { setupYjsSync } from "@/lib/yjsSync";
import type * as Y from "yjs";
import { useEffect, useState } from "react";
import { Awareness } from "y-protocols/awareness.js";
import { createLocalUser, setupAwareness } from "@/lib/presence";
import { setupAwarenessSync } from "@/lib/yjsAwareness";
import { generateRoomId } from "@/lib/room";
import OnlineUsers from "@/components/OnlineUsers";
import ProblemStatement from "@/components/ProblemStatement";
import SessionTimer from "@/components/SessionTimer";
import Chat from "@/components/Chat";

type Language = "javascript" | "python";

type ExecutionResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  message?: string;
  status?: string;
};

export default function Home() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [output, setOutput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [ytext, setYtext] = useState<Y.Text | null>(null);
  const [problem, setProblem] = useState<Y.Text | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // temporary user
  const [user] = useState(() => createLocalUser(`User-${Math.floor(Math.random() * 1000)}`,))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");

    if (room) { setRoomId(room); }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const { ydoc, ytext, problem, awareness } = createYjsDocument();

    setYtext(ytext);
    setProblem(problem);
    setAwareness(awareness);

    const cleanupSync = setupYjsSync(socket, roomId, ydoc);
    const cleanupAwareness = setupAwarenessSync(socket, roomId, awareness);

    setupAwareness(awareness, user);

    return () => {
      cleanupSync();
      cleanupAwareness();

      awareness.destroy();
      ydoc.destroy();

      setYtext(null);
      setProblem(null);
      setAwareness(null);
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId) return;

    function handleConnect() {
      setConnected(true);
      socket.emit("join-room", { roomId, user: { name: user.name, color: user.color } });
    }

    function handleDisconnect() {
      setConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    socket.connect();

    return () => {
      if (socket.connected) {
        socket.emit("leave-room", roomId);
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    function handleExecutionResult(result: ExecutionResult) {

      setIsRunning(false);

      if (result.success) {
        setOutput(result.stdout || "Program finished successfully.");
        return;
      }

      if (result.status === "TO") {
        setOutput(`Execution timed out.\n\n${result.message || "Time limit exceeded."}`);
        return;
      }

      if (result.status === "OL") {
        setOutput(
          result.message || "Output limit exceeded."
        );
        return;
      }

      if (result.status === "EL") {
        setOutput(
          result.message || "Error output limit exceeded."
        );
        return;
      }

      setOutput(
        result.stderr ||
        result.message ||
        "Program exited with an error."
      );
    }


    socket.on("execution-result", handleExecutionResult);

    return () => {
      socket.off("execution-result", handleExecutionResult);
    };
  }, []);

  // Language
  useEffect(() => {
    function handleLanguageState(nextLanguage: Language) {
      setLanguage(nextLanguage);
      setOutput("");
    }

    socket.on("language-state", handleLanguageState);

    return () => {
      socket.off("language-state", handleLanguageState);
    };
  }, [])

  function handleLanguageChange(newLanguage: Language) {
    socket.emit("set-language", roomId, newLanguage);
  }

  async function handleRun() {
    if (!ytext) {
      setOutput("Editor is not ready.");
      return;
    }

    const code = ytext.toString();

    if (!code.trim()) {
      setOutput("Nothing to execute.");
      return;
    }

    setOutput("Running...");
    setIsRunning(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, language, code })
      })

      const result = await response.json();
      setIsRunning(false);

      if (!response.ok) {
        setIsRunning(false);
        setOutput(result.error || "Execution request failed.");
        return;
      }
    } catch (error) {
      setIsRunning(false);
      setOutput("Unable to connect to execution service.");
    }
  }

  function handleCreateRoom() {
    const newRoomId = generateRoomId();
    window.history.pushState({}, "", `/?room=${newRoomId}`);
    setRoomId(newRoomId);
  }

  async function handleCopyRoomLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => { setCopied(false) }, 2000);
  }

  if (!roomId) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold"> Collaborative Code Editor</h1>
          <p className="text-sm text-gray-500">Create a room to start collaborating.</p>
          <button onClick={handleCreateRoom} className="rounded border px-4 py-2">Create Room</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">Collaborative Code Editor</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Room: {roomId}</span>
          <button onClick={handleCopyRoomLink} className="rounded border px-3 py-1 text-sm">
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>

        <SessionTimer roomId={roomId} />

        <span className="text-sm">{connected ? "Connected" : "Disconnected"}
        </span>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(event) =>
              handleLanguageChange(event.target.value as Language)
            }
            className="rounded border px-3 py-2"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-2">
        <div className="min-h-0">
          {ytext && problem && awareness && (
            <div className="h-full flex">

              <div className="flex-1 min-w-0">
                <ProblemStatement problem={problem} />
                <CodeEditor language={language} ytext={ytext} awareness={awareness} />
              </div>

              <OnlineUsers awareness={awareness} />
            </div>
          )}
        </div>

        <div className="border-l p-4">
          <div className="h-1/2 border-b pb-4">
            <h2 className="mb-3 font-semibold">Output</h2>
            <pre className="whitespace-pre-wrap text-sm">{output || "Output will appear here."}</pre>
          </div>

          <div className="h-1/2 pt-4"><Chat roomId={roomId} user={user} /></div>
        </div>
      </section>
    </main>
  );
}