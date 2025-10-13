import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getRemovedStudents = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college")
    throw new ApiError(
      403,
      "Access denied: Only colleges can access this resource"
    );

  const collegeUser = req.user;

  const activeStudentIds = await Class.aggregate([
    { $match: { _id: { $in: collegeUser.classes } } },
    { $unwind: "$students" },
    { $group: { _id: null, studentIds: { $push: "$students" } } },
  ]);

  const studentIdsArray = activeStudentIds[0]?.studentIds || [];

  const removedStudents = await Student.find({
    classId: { $in: collegeUser.classes },
    _id: { $nin: studentIdsArray },
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        removedStudents,
        "Removed students fetched successfully"
      )
    );
});
