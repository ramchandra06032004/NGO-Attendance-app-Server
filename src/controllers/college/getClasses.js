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

  // fetch classes
  const classes = await Class.find({ _id: { $in: collegeExists.classes } });

  res
    .status(200)
    .json(new ApiResponse(200, classes, "Classes fetched successfully"));
});
