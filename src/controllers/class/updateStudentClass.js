import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import redisClient from "../../redis/redisClient.js";

export const updateStudentClass = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college")
    throw new ApiError(
      403,
      "Access denied: Only colleges can update student classes"
    );

  const collegeUser = req.user;

  const { studentId, newClassId } = req.body;
  // student existence check
  const studentExists = await Student.findById(studentId);
  if (!studentExists) throw new ApiError(404, "Student not found");

  // class existence check
  const classExists = await Class.findById(newClassId);
  if (!classExists) throw new ApiError(404, "Class not found");
  // class belongs to college check
  if (!collegeUser.classes.includes(newClassId))
    throw new ApiError(403, "Class does not belong to college");

  // student belongs to target class check
  if (classExists.students.includes(studentId))
    throw new ApiError(400, "Student already belongs to this class");

  const currentClass = await Class.findById(studentExists.classId);
  if (currentClass) {
    // remove student from current class
    await Class.findByIdAndUpdate(currentClass._id, {
      $pull: { students: studentId },
    });
  }

  const updatedStudent = await Student.findByIdAndUpdate(
    studentId,
    { $set: { classId: newClassId } },
    { new: true }
  );

  await Class.findByIdAndUpdate(newClassId, { $push: { students: studentId } });

  await redisClient.del(`college:${collegeUser._id}`);

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedStudent, "Student class updated successfully")
    );
});
