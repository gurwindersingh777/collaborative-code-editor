export type Language = "javascript" | "python";

const roomLanguages = new Map<string, Language>();

const DEFAULT_LANGUAGE: Language = "javascript";

export function getLanguage(roomId: string): Language {
  return roomLanguages.get(roomId) ?? DEFAULT_LANGUAGE;
}

export function setLanguage(roomId: string, language: Language): Language {
  roomLanguages.set(roomId, language);
  return language;
}

export function hydrateLanguage(roomId: string, language: Language): void {
  if (!roomLanguages.has(roomId)) roomLanguages.set(roomId, language);
}