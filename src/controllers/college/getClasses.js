import { Class } from "../../models/class.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export default asyncHandler(async (req, res) => {
  if (req.user.userType !== "college") {
    throw new ApiError(
      403,
      "Access denied: Only colleges can access this resource"
    );
  }

  const collegeUser = req.user;

  // fetch classes
  const classes = await Class.find({ _id: { $in: collegeUser.classes } });

  res
    .status(200)
    .json(new ApiResponse(200, classes, "Classes fetched successfully"));
});
