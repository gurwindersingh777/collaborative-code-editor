"use client";

import CodeEditor from "@/components/CodeEditor";
import { socket } from "@/lib/socket";
import { createYjsDocument } from "@/lib/yjs";
import { setupYjsSync } from "@/lib/yjsSync";
import type * as Y from "yjs";
import { useEffect, useState } from "react";

type Language = "javascript" | "python";

export default function Home() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [output, setOutput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [ytext, setYtext] = useState<Y.Text | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");

    setRoomId(room || "demo-room");
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const { ydoc, ytext } = createYjsDocument();

    setYtext(ytext);

    const cleanupSync = setupYjsSync(
      socket,
      roomId,
      ydoc,
    );

    return () => {
      cleanupSync();
      ydoc.destroy();
      setYtext(null);
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    function handleConnect() {
      setConnected(true);

      socket.emit("join-room", roomId);
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

  function handleLanguageChange(newLanguage: Language) {
    setLanguage(newLanguage);
    setOutput("");
  }

  function handleRun() {
    setOutput("Code sent to execution service.");
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">
          Collaborative Code Editor
        </h1>

        {roomId && (
          <span className="text-sm text-gray-500">
            Room: {roomId}
          </span>
        )}

        <span className="text-sm">
          {connected ? "Connected" : "Disconnected"}
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
            className="rounded border px-4 py-2"
          >
            Run
          </button>
        </div>
      </header>

      <section className="grid min-h-0 flex-1 grid-cols-2">
        <div className="min-h-0">
          {ytext && (
            <CodeEditor
              language={language}
              ytext={ytext}
            />
          )}
        </div>

        <div className="border-l p-4">
          <h2 className="mb-3 font-semibold">Output</h2>

          <pre className="whitespace-pre-wrap text-sm">
            {output || "Output will appear here."}
          </pre>
        </div>
      </section>
    </main>
  );
}