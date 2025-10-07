import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addCollege, addNgo, updateCollege, updateNgo } from "../controllers/admin/index.js";


const router = Router();

// ============ ADMIN-SPECIFIC ROUTES ============
// All routes here require admin authentication

// Admin management routes (protected)
router.route("/add-college").post(verifyJWT, addCollege);
router.route("/add-ngo").post(verifyJWT, addNgo);
router.route("/update-college/:collegeId").put(verifyJWT, updateCollege);
router.route("/update-ngo/:ngoId").put(verifyJWT, updateNgo);

// TODO: Add more admin-specific routes like:
// router.route("/colleges").get(verifyJWT, getAllColleges);
// router.route("/ngos").get(verifyJWT, getAllNgos);
// router.route("/dashboard").get(verifyJWT, getAdminDashboard);

export default router;
