import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { College } from "../../models/college.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const updateCollege = asyncHandler(async (req, res) => {
  // Authorization check
  if (req.user == undefined || req.user.userType !== "admin") {
    throw new ApiError(403, "Only admin users can update colleges");
  }

  const { name, email, address, password, collegeId } = req.body;

  if (!collegeId) {
    throw new ApiError(400, "College ID is required");
  }

  // Validation
  if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    throw new ApiError(400, "Invalid college ID");
  }

  if (!name && !email && !address && !password ) {
    throw new ApiError(400, "At least one field is required to update");
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    const existingCollege = await College.findOne({
      email: email.toLowerCase(),
      _id: { $ne: collegeId },
    });
    if (existingCollege) {
      throw new ApiError(409, "Email is already in use by another college");
    }
  }

  // Name validation (if name is being updated)
  if (name && (name.trim().length < 2 || name.trim().length > 100)) {
    throw new ApiError(
      400,
      "College name must be between 2 and 100 characters"
    );
  }

  // Password validation (if password is being updated)
  if (password && password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  // Find college
  const college = await College.findById(collegeId);
  if (!college) {
    throw new ApiError(404, "College not found");
  }

  // Prepare update object for better performance
  const updateData = {};
  if (name) updateData.name = name.trim().toLowerCase();
  if (email) updateData.email = email.toLowerCase().trim();
  if (address) updateData.address = address.trim();
  if (password) updateData.password = password; // Will be hashed by pre-middleware

  const updatedCollege = await College.findByIdAndUpdate(
    collegeId,
    { $set: updateData },
    {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
      select: "-password -refreshToken", // Exclude sensitive fields from response
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedCollege, "College updated successfully"));
});
