import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const updateInternshipSettings = asyncHandler(async (req, res) => {
  const userType = req.user.userType?.toLowerCase();
  let ngoId;

  if (userType === "ngo") {
    ngoId = req.user._id;
  } else if (userType === "branch_admin") {
    ngoId = req.user.ngoId;
  } else {
    throw new ApiError(403, "Access denied");
  }

  const { internshipId } = req.params;
  const { allowLateSubmissions } = req.body;

  if (typeof allowLateSubmissions !== "boolean") {
    throw new ApiError(400, "allowLateSubmissions must be a boolean");
  }

  // Build scoped query: branch admins can only access their branch + NGO-wide internships
  const internshipQuery = userType === "ngo"
    ? { _id: internshipId, createdBy: ngoId }
    : { _id: internshipId, createdBy: ngoId, $or: [{ branchId: req.user._id }, { branchId: null }] };

  const internship = await Internship.findOneAndUpdate(
    internshipQuery,
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
