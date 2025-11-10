// ...existing code...
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

  // Fetch classes fully populated with student objects (exclude passwords)
  const classesWithStudents = await Class.find({
    _id: { $in: collegeUser.classes },
  }).populate({
    path: "students",
    select: "-password -__v",
  });

  // Flatten and dedupe student objects
  const allStudents = classesWithStudents.flatMap((c) => c.students || []);
  const seen = new Set();
  const uniqueStudents = [];
  for (const s of allStudents) {
    const id = String(s._id || s.id);
    if (!seen.has(id)) {
      seen.add(id);
      uniqueStudents.push(s);
    }
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalCount: uniqueStudents.length,
        students: uniqueStudents,
      },
      "All college students fetched successfully"
    )
  );
});
// ...existing code...