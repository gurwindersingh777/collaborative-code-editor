export type InterviewRole = "interviewer" | "candidate";

type UserRole = {
  userId: string;
  socketId: string;
  role: InterviewRole;
};

const roomRoles = new Map<string, Map<string, UserRole>>();

export function registerRole(roomId: string, userId: string, socketId: string, role: InterviewRole): void {
  let roles = roomRoles.get(roomId);
  if (!roles) {
    roles = new Map();
    roomRoles.set(roomId, roles);
  }
  roles.set(userId, { userId, socketId, role });
}

export function getRole(roomId: string, userId: string): InterviewRole | null {
  return roomRoles.get(roomId)?.get(userId)?.role ?? null;
}

export function isInterviewer(roomId: string, userId: string): boolean {
  return getRole(roomId, userId) === "interviewer";
}