const interviewerModes = new Map<string, boolean>();

export function getInterviewerMode(roomId: string): boolean {
  return interviewerModes.get(roomId) ?? false;
}

export function setInterviewerMode(roomId: string, enabled: boolean): boolean {
  interviewerModes.set(roomId, enabled);
  return enabled;
}

export function clearInterviewerMode(roomId: string): void {
  interviewerModes.delete(roomId);
}