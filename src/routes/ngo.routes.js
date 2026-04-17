import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addEvent,
  getEvents,
  updateEvents,
  getAllNgos,
  removeEvent,
  getRegisteredStudents,
  createInternship,
  getNgoInternships,
  getInternshipApplicants,
  updateApplicantStatus,
  getInternshipWorkLogs,
} from "../controllers/ngo/index.js";
import {
  markAttendance,
  getEventAttendanceForNGO,
  getEventAttendanceForCollege,
} from "../controllers/attendence/index.js";
import { addVolunteers } from "../controllers/ngo/index.js";

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

// Route to add volunteers directly
router.route("/volunteers").post(verifyJWT, addVolunteers);

// ─── Internship Routes ───────────────────────────────────────────────────────
router
  .route("/internships")
  .get(verifyJWT, getNgoInternships)
  .post(verifyJWT, createInternship);

router
  .route("/internships/:internshipId/applicants")
  .get(verifyJWT, getInternshipApplicants);

router
  .route("/internships/:internshipId/applicants/:studentId")
  .patch(verifyJWT, updateApplicantStatus);

router
  .route("/internships/:internshipId/applicants/:studentId/work-logs")
  .get(verifyJWT, getInternshipWorkLogs);
// ─────────────────────────────────────────────────────────────────────────────

export default router;

