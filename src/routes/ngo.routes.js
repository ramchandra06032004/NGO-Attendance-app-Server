import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addEvent,
  getEvents,
  updateEvents,
  getAllNgos,
  removeEvent,
  getRegisteredStudents,
} from "../controllers/ngo/index.js";
import {
  markAttendance,
  getEventAttendanceForNGO,
  getEventAttendanceForCollege,
} from "../controllers/attendence/index.js";

const router = Router();

router.route("/get-all-ngos").get(getAllNgos);

// Event routes
router
  .route("/events")
  .get(verifyJWT, getEvents)
  .post(verifyJWT, addEvent)
  .put(verifyJWT, updateEvents)
  .delete(verifyJWT, removeEvent);

// Attendance routes
router.route("/event/mark-attendance").post(verifyJWT, markAttendance);

router
  .route("/event/:eventId/attendance")
  .get(verifyJWT, getEventAttendanceForNGO);

// New route for NGO to get specific college attendance
router
  .route("/event/:eventId/college/:collegeId/attendance")
  .get(verifyJWT, getEventAttendanceForCollege);

// Route to get all registered students for an event
router
  .route("/events/:eventId/registered-students")
  .get(verifyJWT, getRegisteredStudents);

export default router;
