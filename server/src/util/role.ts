export type InterviewRole = "interviewer" | "candidate";

type UserRole = {
  userId: string;
  socketId: string;
  role: InterviewRole;
};

const roomRoles = new Map<string, Map<string, UserRole>>();

export function assignRole(roomId: string, userId: string, socketId: string): InterviewRole {
  let roles = roomRoles.get(roomId);

  if (!roles) {
    roles = new Map<string, UserRole>();
    roomRoles.set(roomId, roles);
  }

  // User already has a role.
  // This happens when the user refreshes/reconnects.
  const existingRole = roles.get(userId);

  if (existingRole) {
    existingRole.socketId = socketId;
    return existingRole.role;
  }

  // First participant becomes interviewer.
  const hasInterviewer = Array.from(roles.values()).some((entry) => entry.role === "interviewer");

  const role: InterviewRole = hasInterviewer ? "candidate" : "interviewer";

  roles.set(userId, { userId, socketId, role, });

  return role;
}

export function getRole(roomId: string, userId: string): InterviewRole | null {
  const roles = roomRoles.get(roomId);

  if (!roles) return null;

  return roles.get(userId)?.role ?? null;
}

export function isInterviewer(roomId: string, userId: string): boolean {
  return getRole(roomId, userId) === "interviewer";
}

export function removeRole(roomId: string, userId: string): void {
  const roles = roomRoles.get(roomId);

  if (!roles) return;

  const existingRole = roles.get(userId);

  if (existingRole) {
    existingRole.socketId = "";
  }
}