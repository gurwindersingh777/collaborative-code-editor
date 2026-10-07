export type InterviewRole = "interviewer" | "candidate"

const roomRoles = new Map<string, Map<string, InterviewRole>>();

export function getRoomRoles(roomId: string) {
  return roomRoles.get(roomId) ?? new Map<string, InterviewRole>();
}

export function assignRole(roomId: string, socketId: string): InterviewRole {
  let roles = roomRoles.get(roomId);

  if (!roles) {
    roles = new Map<string, InterviewRole>();
    roomRoles.set(roomId, roles);
  }

  // First user in the room becomes the interviewer.
  if (roles.size === 0) {
    roles.set(socketId, "interviewer");
    return "interviewer";
  }

  roles.set(socketId, "candidate");
  return "candidate";
}


export function removeRole(roomId: string, socketId: string) {
  const roles = roomRoles.get(roomId);

  if (!roles) return;
  roles.delete(socketId);
  if (roles.size === 0) roomRoles.delete(roomId);
}
