import { CursorPresence } from "@/types/presence";
import { Awareness } from "y-protocols/awareness.js";

const USER_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F97316",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
  "#EAB308",
  "#EF4444",
];

export interface LocalUser {
  name: string;
  color: string;
}

export function generateUserColor(): string {
  const index = Math.floor(Math.random() * USER_COLORS.length);

  return USER_COLORS[index];
}

export function createLocalUser(name: string): LocalUser {
  return {
    name: name.trim(),
    color: generateUserColor(),
  };
}

export function setupAwareness(awareness: Awareness, user: LocalUser) {
  awareness.setLocalStateField("user", {
    name: user.name,
    color: user.color,
  })
}

export function updateCursor(awareness: Awareness, cursor: CursorPresence) {
  awareness.setLocalStateField("cursor", cursor)
}