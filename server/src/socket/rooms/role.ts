export type InterviewRole = "interviewer" | "candidate";

const roomRoles = new Map<string, Map<string, InterviewRole>>();

export function registerRole(roomId: string, userId: string, role: InterviewRole): void {
  let roles = roomRoles.get(roomId);
  if (!roles) {
    roles = new Map();
    roomRoles.set(roomId, roles);
  }
  roles.set(userId, role);
}

export function isInterviewer(roomId: string, userId: string): boolean {
  return roomRoles.get(roomId)?.get(userId) === "interviewer";
}

export function clearRoles(roomId: string): void { 
  roomRoles.delete(roomId); 
}