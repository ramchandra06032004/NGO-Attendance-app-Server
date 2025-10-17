import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Ngo } from "../../models/ngo.js";

export const updateNgo = asyncHandler(async (req, res) => {
  // Authorization check
  if (req.user == undefined || req.user.userType !== "admin") {
    throw new ApiError(403, "Only admin users can update NGOs");
  }

  const { name, email, address, password, mobile, registrationNumber, ngoId } =
    req.body;

  if (!ngoId) {
    throw new ApiError(400, "NGO ID is required");
  }
  
  // Validation
  if (!mongoose.Types.ObjectId.isValid(ngoId)) {
    throw new ApiError(400, "Invalid NGO ID");
  }

  if (
    !name &&
    !email &&
    !address &&
    !password &&
    !mobile &&
    !registrationNumber 
  ) {
    throw new ApiError(400, "At least one field is required to update");
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    const existingNgo = await Ngo.findOne({
      email: email.toLowerCase(),
      _id: { $ne: ngoId },
    });
    if (existingNgo) {
      throw new ApiError(409, "Email is already in use by another NGO");
    }
  }

  // Name validation (if name is being updated)
  if (name && (name.trim().length < 2 || name.trim().length > 100)) {
    throw new ApiError(400, "NGO name must be between 2 and 100 characters");
  }

  // Password validation (if password is being updated)
  if (password && password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  // Find NGO
  const ngo = await Ngo.findById(ngoId);
  if (!ngo) {
    throw new ApiError(404, "NGO not found");
  }

  // Prepare update object for better performance
  const updateData = {};
  if (name) updateData.name = name.trim().toLowerCase();
  if (email) updateData.email = email.toLowerCase().trim();
  if (address) updateData.address = address.trim();
  if (password) updateData.password = password; // Will be hashed by pre-save middleware
  if (mobile) updateData.mobile = mobile.trim();
  if (registrationNumber)
    updateData.registrationNumber = registrationNumber.trim();

  const updatedNgo = await Ngo.findByIdAndUpdate(
    ngoId,
    { $set: updateData },
    {
      new: true, // Return updated document
      runValidators: true, // Run schema validators
      select: "-password -tokens", // Exclude sensitive fields from response
    }
  );

  if (!updatedNgo) {
    throw new ApiError(404, "NGO not found or could not be updated");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNgo, "NGO updated successfully"));
});
