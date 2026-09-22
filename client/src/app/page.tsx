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

type Language = "javascript" | "python";

export default function Home() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [output, setOutput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [ytext, setYtext] = useState<Y.Text | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);
  const [copied, setCopied] = useState(false);

  // temporary user
  const [user] = useState(() => createLocalUser(`User-${Math.floor(Math.random() * 1000)}`,))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");

    if (room) { setRoomId(room); }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const { ydoc, ytext, awareness } = createYjsDocument();

    setYtext(ytext);
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
      setAwareness(null);
    };
  }, [roomId, user]);

  useEffect(() => {
    if (!roomId) return;

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

  useEffect(() => {
    if (!awareness) return;

    const handleAwarenessChange = () => {
      console.log("Awareness states:", Array.from(awareness.getStates().entries()));
    };

    awareness.on("change", handleAwarenessChange);

    return () => {
      awareness.off("change", handleAwarenessChange);
    };
  }, [awareness]);

  function handleLanguageChange(newLanguage: Language) {
    setLanguage(newLanguage);
    setOutput("");
  }

  function handleRun() {
    setOutput("Code sent to execution service.");
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
          <h1 className="text-2xl font-semibold">
            Collaborative Code Editor
          </h1>

          <p className="text-sm text-gray-500">
            Create a room to start collaborating.
          </p>

          <button
            onClick={handleCreateRoom}
            className="rounded border px-4 py-2"
          >
            Create Room
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-xl font-semibold">
          Collaborative Code Editor
        </h1>

        {roomId && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Room: {roomId}
            </span>

            <button
              onClick={handleCopyRoomLink}
              className="rounded border px-3 py-1 text-sm"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
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
          {ytext && awareness && (
            <CodeEditor
              language={language}
              ytext={ytext}
              awareness={awareness}
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