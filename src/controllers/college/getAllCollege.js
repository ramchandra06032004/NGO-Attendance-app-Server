import { College } from "../../models/college.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getAllColleges = asyncHandler(async (req, res) => {
  try {
    const colleges = await College.find().select("-password -refreshToken");
    if (!colleges) {
      throw new ApiError("No colleges found", 404);
    }
    res
      .status(200)
      .json(new ApiResponse(colleges, "Colleges fetched successfully"));
  } catch (error) {
    throw new ApiError(error.message, error.statusCode || 500);
  }
});
