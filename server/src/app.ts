import express from "express";
import cors from "cors";
import projectRoutes from "./routes/project.routes";
import chunkRoutes from "./routes/chunk.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: true,
    message: "Server is running",
  });
});

app.use("/api/projects", projectRoutes);
app.use("/api/chunks", chunkRoutes);

export default app;
