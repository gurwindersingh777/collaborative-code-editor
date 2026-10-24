import cors from "cors";
import express from "express";
import { config } from "./config/config.js";

const app = express();

app.set("trust proxy", 1);
app.use(cors({ origin: config.clientOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;