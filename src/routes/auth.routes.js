import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { conditionalAdminAuth } from "../middlewares/conditionalAuth.middlewares.js";
import { registerAdmin } from "../controllers/admin/index.js";
import {
  login,
  logout,
  refreshAccessToken,
} from "../controllers/auth/index.js";
import { Branch } from "../models/branch.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// ============ AUTHENTICATION ROUTES FOR ALL USER TYPES ============

// Public routes - Authentication for all user types (admin, college, ngo)
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);

// Smart admin registration - public for first admin, protected for subsequent ones
router.route("/register/admin").post(conditionalAdminAuth, registerAdmin);

// Protected routes - Logout (works for all user types)
router.route("/logout").post(verifyJWT, logout);

// Public route to get branches for a specific NGO (used in login screen)
router.route("/ngo/:ngoId/branches").get(
  asyncHandler(async (req, res) => {
    const { ngoId } = req.params;
    const branches = await Branch.find({ ngoId, isActive: true }).select("_id name location email");
    res.status(200).json(new ApiResponse(200, branches, "Branches fetched successfully"));
  })
);

export default router;
