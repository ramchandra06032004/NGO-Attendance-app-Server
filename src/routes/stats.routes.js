import { Router } from "express";
import { getStats } from "../controllers/stats/stats.controller.js";

const router = Router();

// Public route — no auth required
router.get("/", getStats);

export default router;
