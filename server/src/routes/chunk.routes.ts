import { Router } from "express";
import { createChunks, saveChunks } from "../controllers/chunk.controller";

const router = Router();

router.post("/test", createChunks);
router.post("/save", saveChunks);

export default router;
