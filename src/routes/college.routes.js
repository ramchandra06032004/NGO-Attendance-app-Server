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
  getAllStudents,
  getRemovedStudents,
  recoverStudent,
  updateStudentClass,
} from "../controllers/class/index.js";
import { getAllColleges } from "../controllers/college/index.js";
import { getEventAttendanceForCollege } from "../controllers/attendence/index.js";

const router = Router();

router.route("/get-all-colleges").get(verifyJWT, getAllColleges);

// Class management
router
  .route("/classes")
  .get(verifyJWT, getClasses)
  .post(verifyJWT, addClass)
  .put(verifyJWT, updateClass)
  .delete(verifyJWT, removeClass);

// Students management
router.route("/students/removed").get(verifyJWT, getRemovedStudents);
router.route("/students/recovery").patch(verifyJWT, recoverStudent);

// To get students of a particular class
router.route("/:classId/students").get(verifyJWT, getStudents);

router
  .route("/students")
  .get(verifyJWT, getAllStudents) // To get all students in the logged in college
  .post(verifyJWT, addStudents)
  .put(verifyJWT, updateSingleStudent)
  .patch(verifyJWT, updateStudentClass)
  .delete(verifyJWT, removeSingleStudent);

// Attendance routes
router
  .route("/event/:eventId/attendance")
  .get(verifyJWT, getEventAttendanceForCollege);

export default router;
