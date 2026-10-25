import type { Language } from "../../types/language.js";

const DEFAULT_LANGUAGE: Language = "javascript";

const roomLanguages = new Map<string, Language>();

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

export function clearLanguage(roomId: string): void {
  roomLanguages.delete(roomId);
}