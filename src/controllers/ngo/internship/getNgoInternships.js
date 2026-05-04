import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getNgoInternships = asyncHandler(async (req, res) => {
  const userType = req.user.userType?.toLowerCase();
  let ngoId;

  if (userType === "ngo") {
    ngoId = req.user._id;
  } else if (userType === "branch_admin") {
    // Branch admins belong to an NGO; their ngoId is stored on the branch doc
    ngoId = req.user.ngoId;
    if (!ngoId) throw new ApiError(403, "Branch admin is not associated with an NGO");
  } else {
    throw new ApiError(403, "Access denied: Only NGOs and Branch Admins can access this");
  }

  // Build query:
  // - Super Admin: all internships for the NGO
  // - Branch Admin: internships assigned to their branch OR NGO-wide (branchId = null)
  let query;
  if (userType === "ngo") {
    query = { createdBy: ngoId };
  } else {
    // branch_admin sees their branch + all-branches (null branchId)
    query = {
      createdBy: ngoId,
      $or: [
        { branchId: req.user._id },
        { branchId: null }
      ]
    };
  }

  const internships = await Internship.find(query).populate("branchId", "name").sort({
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
