import { ChatMessage } from "../../types/chat.js";

const MAX_HISTORY = 50;
const history = new Map<string, ChatMessage[]>();

export function addChatMessage(roomId: string, message: ChatMessage): void {
  const list = history.get(roomId) ?? [];
  list.push(message);
  if (list.length > MAX_HISTORY) list.splice(0, list.length - MAX_HISTORY);
  history.set(roomId, list);
}

export function getChatHistory(roomId: string): ChatMessage[] {
  return history.get(roomId) ?? [];
}

export function clearChat(roomId: string): void {
  history.delete(roomId);
}