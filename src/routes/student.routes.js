import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getAllEvents,
    registerForEvent,
    getMyEvents,
} from "../controllers/student/index.js";

const router = Router();

// All student routes require authentication
router.use(verifyJWT);

// Event browsing and registration
router.route("/events").get(getAllEvents);
router.route("/register-event").post(registerForEvent);
router.route("/my-events").get(getMyEvents);

export default router;
