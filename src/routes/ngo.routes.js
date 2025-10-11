import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addEvent,
  getEvents,
  updateEvents,
  getAllNgos,
} from "../controllers/ngo/index.js";
import {
  markAttendance,
  getEventAttendanceForNGO,
  getEventAttendanceForCollege,
} from "../controllers/attendence/index.js";

const router = Router();

router.route("/get-all-ngos").get(verifyJWT, getAllNgos);

// Event routes
router.route("/events").get(verifyJWT, getEvents).post(verifyJWT, addEvent);
router.route("/update-events/:eventId").put(verifyJWT, updateEvents);

// Attendance routes
router
  .route("/event/:eventId/college/:collegeId/mark-attendance")
  .post(verifyJWT, markAttendance);

router
  .route("/event/:eventId/attendance")
  .get(verifyJWT, getEventAttendanceForNGO);

// New route for NGO to get specific college attendance
router
  .route("/event/:eventId/college/:collegeId/attendance")
  .get(verifyJWT, getEventAttendanceForCollege);

export default router;
