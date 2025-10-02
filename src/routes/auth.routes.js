import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import registerAdmin from "../controllers/admin/registerAdmin.js";
import login from "../controllers/auth/login.js"
import logout from "../controllers/auth/logout.js";
import refreshAccessToken from "../controllers/auth/refreshAccessToken.js";
const router = Router();

// ============ AUTHENTICATION ROUTES FOR ALL USER TYPES ============

// Public routes - Authentication for all user types (admin, college, ngo)
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);




router.route("/register/admin").post(registerAdmin);
// TODO: Add registerCollege and registerNGO functions

// Protected routes - Logout (works for all user types)
router.route("/logout").post(verifyJWT, logout);

export default router;
