export type ChatMessage = {
  id: string;
  roomId: string;
  user: {
    name: string;
    color: string;
  };
  message: string;
  timestamp: number;
};