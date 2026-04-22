import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const submitWorkLog = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { internshipId } = req.params;
  const { date, content } = req.body;

  if (!date || !content || !content.trim()) {
    throw new ApiError(400, "Date and content are required");
  }

  const logDate = new Date(date);
  if (isNaN(logDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  const internship = await Internship.findById(internshipId);
  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  const applicant = internship.applicants.find(
    (a) => a.studentId.toString() === studentId.toString()
  );

  if (!applicant) {
    throw new ApiError(403, "You are not an applicant of this internship");
  }

  if (applicant.status !== "accepted") {
    throw new ApiError(
      403,
      "Only accepted interns can submit work logs"
    );
  }

  // Check if internship is still active or late submissions are allowed
  if (new Date() > internship.endDate && !internship.allowLateSubmissions) {
    throw new ApiError(400, "This internship has already ended and late submissions are disabled");
  }

  // Prevent duplicate log for same date
  const logDateStr = logDate.toDateString();
  const duplicate = applicant.workLogs.some(
    (log) => new Date(log.date).toDateString() === logDateStr
  );
  if (duplicate) {
    throw new ApiError(400, "You have already submitted a work log for this date");
  }

  applicant.workLogs.push({
    date: logDate,
    content: content.trim(),
    submittedAt: new Date(),
  });

  await internship.save();

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Work log submitted successfully"));
});
