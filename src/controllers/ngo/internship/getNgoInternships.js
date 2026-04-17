import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getNgoInternships = asyncHandler(async (req, res) => {
  if (req.user.userType?.toLowerCase() !== "ngo") {
    throw new ApiError(403, "Access denied: Only NGOs can access this");
  }

  const internships = await Internship.find({ createdBy: req.user._id }).sort({
    createdAt: -1,
  });

  const internshipsWithCounts = internships.map((internship) => {
    const obj = internship.toObject();
    obj.totalApplicants = internship.applicants.length;
    obj.pendingCount = internship.applicants.filter(
      (a) => a.status === "pending"
    ).length;
    obj.acceptedCount = internship.applicants.filter(
      (a) => a.status === "accepted"
    ).length;
    obj.rejectedCount = internship.applicants.filter(
      (a) => a.status === "rejected"
    ).length;
    // Remove full applicants list to keep response lightweight
    delete obj.applicants;
    return obj;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        internshipsWithCounts,
        "Internships fetched successfully"
      )
    );
});
