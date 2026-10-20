import "dotenv/config"; 
import { createServer } from "node:http";
import app from "./app.js";
import { config } from "./config/config.js";
import { shutdown } from "./lib/shutdown.js";
import { createSocketServer } from "./socket/index.js";

const httpServer = createServer(app);

createSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));