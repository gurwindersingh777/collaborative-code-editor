export type RoomUser = { id: string; name: string; color: string };
export type JoinRoomPayload = { roomId: string; user: RoomUser };
export type YjsUpdatePayload = { roomId: string; update: unknown };
export type AwarenessUpdatePayload = { roomId: string; clientId: number; update: unknown };
export type SendChatPayload = { roomId: string; message: string };
export type InterviewerModePayload = { roomId: string; enabled: boolean };