import type { Awareness } from "y-protocols/awareness.js";
import type { UserPresence } from "@/types/presence";

const USER_COLORS = [
  "#3B82F6", "#22C55E", "#F97316", "#A855F7",
  "#EC4899", "#14B8A6", "#EAB308", "#EF4444",
];

export type LocalUser = UserPresence & { id: string };

export function createLocalUser(name = `User-${Math.floor(Math.random() * 1000)}`): LocalUser {
  return {
    id: crypto.randomUUID(),
    name,
    color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
  };
}

export function setupAwareness(awareness: Awareness, user: UserPresence) {
  awareness.setLocalStateField("user", { name: user.name, color: user.color });
}