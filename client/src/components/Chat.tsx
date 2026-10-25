import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
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
    function handleHistory(data: { roomId: string; messages: ChatMessage[] }) {
      if (data.roomId === roomId) setMessages(data.messages);
    }

    socket.on("chat-message", handleMessage);
    socket.on("chat-history", handleHistory);
    return () => {
      socket.off("chat-message", handleMessage);
      socket.off("chat-history", handleHistory);
    };
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

      <div className="flex gap-2 border-t border-vs-line p-2 ">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) send();
          }}
          placeholder="Message (Enter to send)"
          className="field min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          className="btn btn-primary shrink-0 gap-1.5"
          aria-label="Send message"
        >
          <Send data-icon="inline-start" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
}