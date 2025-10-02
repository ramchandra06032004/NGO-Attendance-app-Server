import { Class } from "../../models/class.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export default asyncHandler(async (req, res) => {
  const { collegeId } = req.params;

  // college existence check
  const collegeExists = await College.findById(collegeId);
  if (!collegeExists) throw new ApiError(404, "College not found");

  let { className } = req.body;

  // validate className
  if (!className || typeof className !== "string" || !className.trim()) {
    throw new ApiError(400, "Class name must be a non-empty string");
  }
  className = className.trim();

  // check for duplicate className within this college only
  const classInCollege = await Class.findOne({
    _id: { $in: collegeExists.classes },
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
  await College.findByIdAndUpdate(collegeId, {
    $push: { classes: newClass._id },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class created successfully"));
});
