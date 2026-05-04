import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getAllEvents,
    registerForEvent,
    getMyEvents,
    getAllInternships,
    applyForInternship,
    getMyInternships,
    submitWorkLog,
    getStudentWorkLogs,
} from "../controllers/student/index.js";

const router = Router();

// All student routes require authentication
router.use(verifyJWT);

// Event browsing and registration
router.route("/events").get(getAllEvents);
router.route("/register-event").post(registerForEvent);
router.route("/my-events").get(getMyEvents);

// ─── Internship Routes ───────────────────────────────────────────────────────
router.route("/internships").get(getAllInternships);
router.route("/internships/:internshipId/apply").post(applyForInternship);
router.route("/my-internships").get(getMyInternships);
router.route("/internships/:internshipId/work-log").post(submitWorkLog);
router.route("/internships/:internshipId/work-logs").get(getStudentWorkLogs);
// ─────────────────────────────────────────────────────────────────────────────

export default router;

