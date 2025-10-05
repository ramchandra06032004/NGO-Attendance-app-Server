import { asyncHandler } from "../utils/asyncHandler.js";
import { Admin } from "../models/admin.js";

// Conditional middleware - only apply verifyJWT if admins already exist
export const conditionalAdminAuth = asyncHandler(async (req, res, next) => {
  const adminCount = await Admin.countDocuments();

  if (adminCount === 0) {
    // First admin registration - no authentication required
    console.log("🚀 First admin registration - skipping authentication");
    return next();
  } else {
    // Subsequent admin registrations - require authentication
    console.log(
      "👮 Admin exists - requiring authentication for new admin registration"
    );
    const { verifyJWT } = await import("./auth.middlewares.js");
    return verifyJWT(req, res, next);
  }
});
