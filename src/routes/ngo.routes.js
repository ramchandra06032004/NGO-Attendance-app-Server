import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
  addEvent,
  getEvents,
  updateEvents,
  getAllNgos,
} from "../controllers/ngo/index.js";

const router = Router();

router.route("/get-all-ngos").get(verifyJWT, getAllNgos);

// Event routes
router.route("/events").get(verifyJWT, getEvents).post(verifyJWT, addEvent);
router.route("/update-events/:eventId").put(verifyJWT, updateEvents);

export default router;
