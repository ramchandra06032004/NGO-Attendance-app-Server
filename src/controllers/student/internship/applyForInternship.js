import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const applyForInternship = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { internshipId } = req.params;

  const internship = await Internship.findById(internshipId);
  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  // Check if internship has ended
  if (new Date() > internship.endDate) {
    throw new ApiError(400, "This internship has already ended");
  }

  // Check if already applied
  const alreadyApplied = internship.applicants.some(
    (a) => a.studentId.toString() === studentId.toString()
  );
  if (alreadyApplied) {
    throw new ApiError(400, "You have already applied for this internship");
  }

  // Check slots (only accepted students count against slots; pending is fine)
  const acceptedCount = internship.applicants.filter(
    (a) => a.status === "accepted"
  ).length;
  if (acceptedCount >= internship.totalSlots) {
    throw new ApiError(
      400,
      "No slots available — this internship is full"
    );
  }

  internship.applicants.push({
    studentId,
    status: "pending",
    appliedAt: new Date(),
    workLogs: [],
  });

  await internship.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Application submitted successfully! Please wait for NGO response.")
    );
});
