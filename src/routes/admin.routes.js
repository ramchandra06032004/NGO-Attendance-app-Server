import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import addCollege from "../controllers/admin/addCollege.js";
import addNgo from "../controllers/admin/addNgo.js";

const router = Router();

// ============ ADMIN-SPECIFIC ROUTES ============
// All routes here require admin authentication

// Admin management routes (protected)
router.route("/add-college").post(verifyJWT, addCollege);
router.route("/add-ngo").post(verifyJWT, addNgo);

// TODO: Add more admin-specific routes like:
// router.route("/colleges").get(verifyJWT, getAllColleges);
// router.route("/ngos").get(verifyJWT, getAllNgos);
// router.route("/dashboard").get(verifyJWT, getAdminDashboard);

export default router;
