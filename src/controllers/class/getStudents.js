import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export default asyncHandler(async (req, res) => {
  const { collegeId, classId } = req.params;

  // college existence check
  const collegeExists = await College.findById(collegeId);
  if (!collegeExists) throw new ApiError(404, "College not found");

  // class belongs to college check
  if (!collegeExists.classes.includes(classId)) {
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
