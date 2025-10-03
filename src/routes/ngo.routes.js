import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addEvent, getEvents } from "../controllers/ngo/index.js";

const router = Router();

// ============ NGO-SPECIFIC ROUTES ============
// All routes here require NGO authentication

// TODO: Add NGO-specific routes like:
router.route("/events").get(verifyJWT, getEvents).post(verifyJWT, addEvent);
// router.route("/profile").get(verifyJWT, getNgoProfile);
// router.route("/profile").put(verifyJWT, updateNgoProfile);
// router.route("/events").get(verifyJWT, getNgoEvents);
// router.route("/events").post(verifyJWT, createEvent);
// router.route("/events/:id").put(verifyJWT, updateEvent);
// router.route("/events/:id").delete(verifyJWT, deleteEvent);

export default router;
