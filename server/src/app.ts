import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import executeRouter from "./routes/execute.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/execute", rateLimit({
  windowMs: 60_000,
  limit: 20,
  message: { error: "Too many runs. Wait a moment and try again." },
}));

app.use("/api", executeRouter);

export default app;