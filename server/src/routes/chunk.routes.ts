import { Router } from "express";
import { createChunks } from "../controllers/chunk.controller";

const router = Router();

router.post("/test", createChunks);

export default router;
