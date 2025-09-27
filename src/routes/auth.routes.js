import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { login, logout, refreshAccessToken } from "../controllers/auth.js";
import { registerAdmin } from "../controllers/admin.js";

const router = Router();

// ============ AUTHENTICATION ROUTES FOR ALL USER TYPES ============

// Public routes - Authentication for all user types (admin, college, ngo)
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);

// Registration routes (public)
router.route("/register/admin").post(registerAdmin);
// TODO: Add registerCollege and registerNGO functions

// Protected routes - Logout (works for all user types)
router.route("/logout").post(verifyJWT, logout);

export default router;
