import type { Server, Socket } from "socket.io";

import { saveLanguage } from "../../services/roomPersistence.js";
import { isLanguage } from "../../types/language.js";
import { inRoom, onSafe } from "../helpers.js";
import { setLanguage } from "../rooms/language.js";

export function registerLanguageHandlers(io: Server, socket: Socket) {
  onSafe(socket, "set-language", (roomId: string, language: unknown) => {
    if (!inRoom(socket, roomId)) return;
    if (!isLanguage(language)) return;

    io.to(roomId).emit("language-state", setLanguage(roomId, language));

    // Save it so the choice survives a server restart
    void saveLanguage(roomId, language).catch((error) =>
      console.error("Failed to save language:", error)
    );
  });
}