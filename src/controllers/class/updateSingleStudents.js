import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import mongoose from "mongoose";
import { Student } from "../../models/student.js";

export const updateSingleStudent = asyncHandler(async (req, res) => {
  if (req.user == undefined || req.user.userType !== "college") {
    throw new ApiError(403, "Only college users can update students");
  }

  const { studentId } = req.params;
  const { name, email, department, password } = req.body;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid student ID format");
  }

  if (!name && !email && !department && !password) {
    throw new ApiError(400, "At least one field is required to update");
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }
  }

  // Find student
  const student = await Student.findById(studentId);
  if (!student) {
    throw new ApiError(
      404,
      "Student not found or does not belong to your college"
    );
  }

  // Prepare update object for better performance
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase();
  if (department) updateData.department = department;
  if (password) updateData.password = password;

  // Update student
  await Student.updateOne({ _id: studentId }, { $set: updateData });

  // Send response
  res.status(200).json(new ApiResponse(200, "Student updated successfully"));
});
