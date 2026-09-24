import express from "express";
import cors from "cors";
import projectRoutes from "./routes/project.routes";

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

export default app;
