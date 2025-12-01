import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addCollege, addNgo, updateCollege, updateNgo } from "../controllers/admin/index.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ============ ADMIN-SPECIFIC ROUTES ============
// All routes here require admin authentication

// Admin management routes (protected)
router.route("/add-college").post(verifyJWT, upload.single("logo"), addCollege);
router.route("/add-ngo").post(
    verifyJWT,
    upload.single("logo"),
    addNgo
);
router.route("/update-college").put(verifyJWT, updateCollege);
router.route("/update-ngo").put(verifyJWT, updateNgo);

// TODO: Add more admin-specific routes like:
// router.route("/colleges").get(verifyJWT, getAllColleges);
// router.route("/ngos").get(verifyJWT, getAllNgos);
// router.route("/dashboard").get(verifyJWT, getAdminDashboard);

export default router;
