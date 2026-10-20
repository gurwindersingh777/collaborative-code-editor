import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";
import type { ChatMessage } from "@/types/room";

type ChatProps = { roomId: string; active: boolean };

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat({ roomId, active }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMessage(chatMessage: ChatMessage) {
      if (chatMessage.roomId !== roomId) return;
      setMessages((current) => [...current, chatMessage]);
    }

    socket.on("chat-message", handleMessage);
    return () => { socket.off("chat-message", handleMessage); };
  }, [roomId]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, active]);

  function send() {
    const message = draft.trim();
    if (!message) return;

    socket.emit("send-chat-message", { roomId, message });
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <p className="text-xs text-vs-muted">No messages yet.</p>
        ) : (
          messages.map((chatMessage) => (
            <div key={chatMessage.id} className="text-xs leading-5">
              <span className="font-medium" style={{ color: chatMessage.user.color }}>
                {chatMessage.user.name}
              </span>
              <span className="ml-2 text-vs-muted">{formatTime(chatMessage.timestamp)}</span>
              <p className="whitespace-pre-wrap wrap-break-word">{chatMessage.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-vs-line p-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") send(); }}
          placeholder="Message (Enter to send)"
          className="field w-full"
        />
      </div>
    </div>
  );
}