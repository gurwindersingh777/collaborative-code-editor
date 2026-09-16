import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { createSocketServer } from "./socket.js";

const PORT = Number(process.env.PORT) || 4000;

const httpServer = createServer(app);

createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});