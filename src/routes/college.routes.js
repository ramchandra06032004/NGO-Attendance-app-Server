import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addClass,
  getClasses,
  updateClass,
  removeClass,
} from "../controllers/college/index.js";
import {
  addStudents,
  getStudents,
  updateSingleStudent,
  removeSingleStudent,
} from "../controllers/class/index.js";
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
  .route("/:classId/students")
  .get(verifyJWT, getStudents)
  .post(verifyJWT, addStudents);

router
  .route("/:classId/students/:studentId")
  .put(verifyJWT, updateSingleStudent)
  .delete(verifyJWT, removeSingleStudent);

export default router;
