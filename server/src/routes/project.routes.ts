import { Router } from "express";
import { addProject } from "../controllers/project.controller";

const router = Router();

router.post("/add", addProject);

export default router;
