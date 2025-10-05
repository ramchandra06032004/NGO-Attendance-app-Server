import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addEvent,
  getEvents,
  updateEvents,
  removeEvent,
} from "../controllers/ngo/index.js";

const router = Router();

// ============ NGO-SPECIFIC ROUTES ============
// All routes here require NGO authentication

// Event routes
router.route("/events").get(verifyJWT, getEvents).post(verifyJWT, addEvent);
router.route("/update-events/:eventId").put(verifyJWT, updateEvents);

router
  .route("/events/:eventId")
  .put(verifyJWT, updateEvents)
  .delete(verifyJWT, removeEvent);
// router.route("/profile").get(verifyJWT, getNgoProfile);
// router.route("/profile").put(verifyJWT, updateNgoProfile);
// router.route("/events").get(verifyJWT, getNgoEvents);
// router.route("/events").post(verifyJWT, createEvent);
// router.route("/events/:id").put(verifyJWT, updateEvent);
// router.route("/events/:id").delete(verifyJWT, deleteEvent);

export default router;
