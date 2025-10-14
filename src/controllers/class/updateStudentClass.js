import mongoose from "mongoose";
import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const updateStudentClass = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college")
    throw new ApiError(
      403,
      "Access denied: Only colleges can update student classes"
    );

  const collegeUser = req.user;

  const { studentId, newClassId } = req.params;
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

  /*
   * The below commented-out code uses a transaction session to ensure atomicity.
   * Can use it if needed in future, but requires MongoDB replica set (don't really know what that is)
   * If using the current commented-out code, ensure to comment out the non-session code below it.
   */

  // let updatedStudent = null;
  // const session = await mongoose.startSession();

  // await session.withTransaction(async () => {
  //   const currentClass = await Class.findById(studentExists.classId);
  //   if (currentClass) {
  //     // remove student from current class
  //     await Class.findByIdAndUpdate(
  //       currentClass._id,
  //       { $pull: { students: studentId } },
  //       { session }
  //     );
  //   }

  //   updatedStudent = await Student.findByIdAndUpdate(
  //     studentId,
  //     { $set: { classId: newClassId } },
  //     { new: true, session }
  //   );

  //   await Class.findByIdAndUpdate(
  //     newClassId,
  //     { $push: { students: studentId } },
  //     { session }
  //   );
  // });

  // await session.endSession();

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

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedStudent, "Student class updated successfully")
    );
});
