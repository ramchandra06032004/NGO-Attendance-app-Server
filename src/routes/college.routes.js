import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addClass, getClasses } from "../controllers/college/index.js";
import { addStudents, getStudents } from "../controllers/class/index.js";

const router = Router();

// ============ COLLEGE-SPECIFIC ROUTES ============
// All routes here require college authentication

// TODO: Add college-specific routes like:

// Class management
router.route("/classes").get(verifyJWT, getClasses).post(verifyJWT, addClass);

// Students management
router
  .route("/classes/:classId/students")
  .get(verifyJWT, getStudents)
  .post(verifyJWT, addStudents);
// Note: classId param is required in the above route

// router.route("/profile").get(verifyJWT, getCollegeProfile);
// router.route("/profile").put(verifyJWT, updateCollegeProfile);
// router.route("/students").get(verifyJWT, getStudents);
// router.route("/students").post(verifyJWT, addStudent);
// router.route("/events").get(verifyJWT, getCollegeEvents);

export default router;
