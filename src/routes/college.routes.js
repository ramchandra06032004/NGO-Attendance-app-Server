import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// ============ COLLEGE-SPECIFIC ROUTES ============
// All routes here require college authentication

// TODO: Add college-specific routes like:
// router.route("/profile").get(verifyJWT, getCollegeProfile);
// router.route("/profile").put(verifyJWT, updateCollegeProfile);
// router.route("/students").get(verifyJWT, getStudents);
// router.route("/students").post(verifyJWT, addStudent);
// router.route("/events").get(verifyJWT, getCollegeEvents);

export default router;
