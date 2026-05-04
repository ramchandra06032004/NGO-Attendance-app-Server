import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const updateApplicantStatus = asyncHandler(async (req, res) => {
  const userType = req.user.userType?.toLowerCase();
  let ngoId;

  if (userType === "ngo") {
    ngoId = req.user._id;
  } else if (userType === "branch_admin") {
    ngoId = req.user.ngoId;
  } else {
    throw new ApiError(403, "Access denied");
  }

  const { internshipId, studentId } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    throw new ApiError(400, "Status must be 'accepted' or 'rejected'");
  }

  // Build scoped query: branch admins can only access their branch + NGO-wide internships
  const internshipQuery = userType === "ngo"
    ? { _id: internshipId, createdBy: ngoId }
    : { _id: internshipId, createdBy: ngoId, $or: [{ branchId: req.user._id }, { branchId: null }] };

  const internship = await Internship.findOne(internshipQuery);

  if (!internship) {
    throw new ApiError(404, "Internship not found or unauthorized");
  }

  const applicant = internship.applicants.find(
    (a) => a.studentId.toString() === studentId
  );

  if (!applicant) {
    throw new ApiError(404, "Applicant not found in this internship");
  }

  // Check slot capacity when accepting
  if (status === "accepted") {
    const currentlyAccepted = internship.applicants.filter(
      (a) => a.status === "accepted"
    ).length;
    if (
      applicant.status !== "accepted" &&
      currentlyAccepted >= internship.totalSlots
    ) {
      throw new ApiError(
        400,
        `No slots available. This internship has ${internship.totalSlots} total slot(s).`
      );
    }
  }

  applicant.status = status;
  await internship.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { status },
        `Student ${status === "accepted" ? "accepted" : "rejected"} successfully`
      )
    );
});
