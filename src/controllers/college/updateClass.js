import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Class } from "../../models/class.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";

export const updateClass = asyncHandler(async (req, res) => {
  if (req.user == undefined || req.user.userType !== "college") {
    throw new ApiError(403, "Only college users can update classes");
  }

  const { className, classId } = req.body;

  if (!classId) {
    throw new ApiError(400, "Class ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throw new ApiError(400, "Invalid class ID");
  }

  const classNameRegex = /^\d{4}-\d{4}.{1,6}$/;
  if (!className || !classNameRegex.test(className)) {
    throw new ApiError(
      400,
      "Class name must be in format: [YYYY-YYYY][1-6 characters]. Example: 2023-2024FE, 2024-2025SE"
    );
  }

  // Check for duplicate class name
  const existingClass = await Class.findOne({
    className,
    _id: { $ne: classId },
  });
  if (existingClass) {
    throw new ApiError(409, "Class name already exists");
  }

  // Update class
  const classToUpdate = await Class.findByIdAndUpdate(
    classId,
    { className },
    { new: true, runValidators: true }
  );

  if (!classToUpdate) {
    throw new ApiError(404, "Class not found or could not be updated");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Class updated successfully", classToUpdate));
});
