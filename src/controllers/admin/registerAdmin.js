import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Admin } from "../../models/admin.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const registerAdmin = asyncHandler(async (req, res) => {
  // Check if this is the first admin registration
  const adminCount = await Admin.countDocuments();

  // If admins exist, require authentication and admin role
  if (adminCount > 0) {
    if (!req.user || req.user.userType !== "admin") {
      throw new ApiError(403, "Only admin users can register new admins");
    }
  }

  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await Admin.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const newUser = await Admin.create({ username, email, password });
  return res
    .status(201)
    .json(new ApiResponse(201, newUser, "Admin registered successfully"));
});
