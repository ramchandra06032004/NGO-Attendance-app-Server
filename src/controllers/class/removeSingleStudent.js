import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const removeSingleStudent = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college")
    throw new ApiError(403, "Access denied: Only colleges can remove students");

  const collegeUser = req.user;

  const { classId, studentId } = req.params;

  // student existence check
  const studentExists = await Student.findById(studentId);
  if (!studentExists) throw new ApiError(404, "Student not found");

  // class existsence check
  const classExists = await Class.findById(classId);
  if (!classExists) throw new ApiError(404, "Class not found");

  // class belongs to college check
  if (!collegeUser.classes.includes(classId))
    throw new ApiError(403, "Class does not belong to this college");

  // student belongs to class check
  if (!classExists.students.includes(studentId))
    throw new ApiError(
      400,
      "Student is not in this class, maybe he/she was removed"
    );

  // Remove student from class
  await Class.findByIdAndUpdate(classId, {
    $pull: { students: studentId },
  });

  res
    .status(200)
    .json(new ApiResponse(200, [], "Student removed from class successfully"));
});
