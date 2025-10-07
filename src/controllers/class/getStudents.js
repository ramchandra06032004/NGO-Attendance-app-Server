import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getStudents = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college") {
    throw new ApiError(
      403,
      "Access denied: Only colleges can access this resource"
    );
  }

  const collegeUser = req.user;

  const { classId } = req.params;
  // class belongs to college check
  if (!collegeUser.classes.includes(classId)) {
    throw new ApiError(403, "Class does not belong to this college");
  }

  // class existence check
  const classExists = await Class.findById(classId);
  if (!classExists) throw new ApiError(404, "Class not found");

  // fetch students
  const students = await Student.find({
    _id: { $in: classExists.students },
  }).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, students, "Students fetched successfully"));
});
