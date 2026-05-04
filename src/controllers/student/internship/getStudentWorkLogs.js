import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getStudentWorkLogs = asyncHandler(async (req, res) => {
  if (req.user.userType?.toLowerCase() !== "student") {
    throw new ApiError(403, "Access denied");
  }

  const { internshipId } = req.params;
  const studentId = req.user._id;

  const internship = await Internship.findById(internshipId)
    .populate("createdBy", "name email");

  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  const applicant = internship.applicants.find(
    (a) => a.studentId?.toString() === studentId.toString()
  );

  if (!applicant) {
    throw new ApiError(404, "You are not an applicant for this internship");
  }

  const startDate = new Date(internship.startDate);
  const endDate = new Date(internship.endDate);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  const workLogs = (applicant.workLogs || []).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        student: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        internship: {
          _id: internship._id,
          title: internship.title,
          domain: internship.domain,
          startDate: internship.startDate,
          endDate: internship.endDate,
          totalDays,
          allowLateSubmissions: internship.allowLateSubmissions,
          ngo: internship.createdBy.name,
        },
        status: applicant.status,
        workLogs,
        totalLogs: workLogs.length,
      },
      "Your work logs fetched successfully"
    )
  );
});
