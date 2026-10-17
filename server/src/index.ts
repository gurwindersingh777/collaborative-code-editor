import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { createSocketServer } from "./socket.js";
import { shutdown } from "./util/shutdown.js";

const PORT = Number(process.env.PORT) || 4000;

const httpServer = createServer(app);

createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));