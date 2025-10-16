import { Class } from "../../models/class.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const removeClass = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college") {
    throw new ApiError(403, "Access denied: Only colleges can remove a class");
  }

  const collegeUser = req.user;

  const { classId } = req.body;
  // class existence check
  const classExists = await Class.findById(classId);
  if (!classExists) throw new ApiError(404, "Class not found");

  // class belongs to college check
  if (!collegeUser.classes.includes(classId))
    throw new ApiError(
      403,
      "Class does not belong to this college, may be it was removed"
    );

  if (classExists.students.length)
    throw new ApiError(
      400,
      "Class is not empty! Remove all students before deleting the class"
    );

  // remove class
  await Class.findByIdAndDelete(classId);

  // remove class from college
  await College.findByIdAndUpdate(collegeUser._id, {
    $pull: { classes: classId },
  });

  res.status(200).json(new ApiResponse(200, [], "Class removed successfully"));
});
