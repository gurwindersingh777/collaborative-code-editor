import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";


type ChatMessage = {
  id: string;
  roomId: string;
  user: {
    name: string;
    color: string;
  };
  message: string;
  timestamp: number;
};

type ChatProps = {
  roomId: string;
  user: {
    name: string;
    color: string;
  };
};

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Chat({ roomId, user }: ChatProps) {

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")

  useEffect(() => {
    function handleChatMessage(chatMessage: ChatMessage) {
      if (chatMessage.roomId !== roomId) return;

      setMessages((currentMessages) => [...currentMessages, chatMessage,]);
    }

    socket.on("chat-message", handleChatMessage);

    return () => {
      socket.off("chat-message", handleChatMessage);
    };
  }, [roomId]);
  
  function handleSendMessage() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    socket.emit("send-chat-message", { roomId, message: trimmedMessage, user });
    setMessage("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-3 font-semibold">Chat</h2>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto border p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet.</p>
        ) : (
          messages.map((chatMessage) => (
            <div key={chatMessage.id}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chatMessage.user.color }} />
                <span className="text-sm font-medium">{chatMessage.user.name}</span>
                <span className="text-xs text-gray-500">{formatTimestamp(chatMessage.timestamp)}</span>
              </div>

              <p className="mt-1 text-sm">{chatMessage.message}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-w-0 flex-1 rounded border px-3 py-2 text-sm"
        />

        <button onClick={handleSendMessage} className="rounded border px-4 py-2 text-sm">Send</button>
      </div>
    </div>
  );
}