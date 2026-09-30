import cors from "cors";
import express from "express";
import executeRouter from "./routes/execute.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api", executeRouter);

export default app;