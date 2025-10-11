import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getAllStudents = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college")
    throw new ApiError(
      403,
      "Access denied: Only colleges can access this resource"
    );

  const collegeUser = req.user;

  // Get all student IDs from all classes in this college (optimized aggregation)
  const allStudentIdsInCollege = await Class.aggregate([
    { $match: { _id: { $in: collegeUser.classes } } },
    { $unwind: "$students" },
    { $group: { _id: null, studentIds: { $push: "$students" } } },
  ]);

  const studentIdsArray = allStudentIdsInCollege[0]?.studentIds || [];

  // Fetch all students belonging to this college
  const allStudents = await Student.find({
    _id: { $in: studentIdsArray },
  }).select("-password"); // Exclude password field

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: allStudents.length,
        students: allStudents,
      },
      "All college students fetched successfully"
    )
  );
});
