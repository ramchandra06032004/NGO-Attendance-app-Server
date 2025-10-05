import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addClass, getClasses } from "../controllers/college/index.js";
import { addStudents, getStudents, updateSingleStudent } from "../controllers/class/index.js";
import { updateClass } from "../controllers/college/index.js";

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

router.route("/classes/:classId/students/:studentId").put(verifyJWT, updateSingleStudent);
// Note: classId param is required in the above route

router.route("/update-class/:classId").put(verifyJWT, updateClass);
// router.route("/profile").get(verifyJWT, getCollegeProfile);
// router.route("/profile").put(verifyJWT, updateCollegeProfile);
// router.route("/students").get(verifyJWT, getStudents);
// router.route("/students").post(verifyJWT, addStudent);
// router.route("/events").get(verifyJWT, getCollegeEvents);

export default router;
