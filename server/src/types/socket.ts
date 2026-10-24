export type RoomUser = { id: string; name: string; color: string };
export type JoinRoomPayload = { roomId: string; user: RoomUser; hostToken?: string };
export type YjsUpdatePayload = { roomId: string; update: Uint8Array };
export type AwarenessUpdatePayload = { roomId: string; clientId: number; update: unknown };
export type SendChatPayload = { roomId: string; message: string };
export type InterviewerModePayload = { roomId: string; enabled: boolean };
export type RenameUserPayload = { roomId: string; name: string };
export type RunCodePayload = { roomId: string };