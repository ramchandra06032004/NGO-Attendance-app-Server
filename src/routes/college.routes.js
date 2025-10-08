import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addClass, getClasses } from "../controllers/college/index.js";
import {
  addStudents,
  getStudents,
  updateSingleStudent,
} from "../controllers/class/index.js";
import { updateClass } from "../controllers/college/index.js";
import { getAllColleges } from "../controllers/college/index.js";

const router = Router();

router.route("/get-all-colleges").get(verifyJWT, getAllColleges);

// Class management
router.route("/classes").get(verifyJWT, getClasses).post(verifyJWT, addClass);

router
  .route("/classes/:classId")
  .put(verifyJWT, updateClass)
  .delete(verifyJWT, removeClass);

// Students management
router
  .route("/classes/:classId/students")
  .get(verifyJWT, getStudents)
  .post(verifyJWT, addStudents);

router
  .route("/classes/:classId/students/:studentId")
  .put(verifyJWT, updateSingleStudent);
// Note: classId param is required in the above route

router.route("/update-class/:classId").put(verifyJWT, updateClass);

export default router;
