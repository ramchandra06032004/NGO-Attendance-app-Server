import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getAllInternships = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Get all internships, populate NGO name
  const internships = await Internship.find().populate(
    "createdBy",
    "name address profileImage"
  ).sort({ createdAt: -1 });

  const now = new Date();

  // Annotate each internship with the student's application status
  const annotated = internships.map((internship) => {
    const obj = internship.toObject();

    const applicant = internship.applicants.find(
      (a) => a.studentId.toString() === studentId.toString()
    );

    obj.applicationStatus = applicant ? applicant.status : null; // null = not applied
    obj.hasApplied = !!applicant;

    // Count available slots
    const acceptedCount = internship.applicants.filter(
      (a) => a.status === "accepted"
    ).length;
    obj.slotsLeft = Math.max(0, internship.totalSlots - acceptedCount);
    obj.isActive = internship.endDate >= now;

    // Remove applicants list from student view
    delete obj.applicants;

    return obj;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, annotated, "Internships fetched successfully"));
});
