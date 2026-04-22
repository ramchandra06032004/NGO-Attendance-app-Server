import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const updateInternshipSettings = asyncHandler(async (req, res) => {
  if (req.user.userType?.toLowerCase() !== "ngo") {
    throw new ApiError(403, "Access denied");
  }

  const { internshipId } = req.params;
  const { allowLateSubmissions } = req.body;

  if (typeof allowLateSubmissions !== "boolean") {
    throw new ApiError(400, "allowLateSubmissions must be a boolean");
  }

  const internship = await Internship.findOneAndUpdate(
    { _id: internshipId, createdBy: req.user._id },
    { $set: { allowLateSubmissions } },
    { new: true }
  );

  if (!internship) {
    throw new ApiError(404, "Internship not found or unauthorized");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { allowLateSubmissions: internship.allowLateSubmissions },
        "Internship settings updated successfully"
      )
    );
});
