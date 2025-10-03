import { Class } from "../../models/class.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const addClass= asyncHandler(async (req, res) => {
  if (req.user.userType !== "college") {
    throw new ApiError(403, "Access denied: Only colleges can add classes");
  }

  const collegeUser = req.user;

  let { className } = req.body;

  // validate className
  if (!className || typeof className !== "string" || !className.trim()) {
    throw new ApiError(400, "Class name must be a non-empty string");
  }
  className = className.trim();

  // check for duplicate className within this college only
  const classInCollege = await Class.findOne({
    _id: { $in: collegeUser.classes },
    className: className,
  });

  if (classInCollege) {
    throw new ApiError(
      409,
      "Class with this name already exists in this college"
    );
  }

  // create new class
  const newClass = await Class.create({ className });

  // add class to college's classes array
  await College.findByIdAndUpdate(collegeUser._id, {
    $push: { classes: newClass._id },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class created successfully"));
});
