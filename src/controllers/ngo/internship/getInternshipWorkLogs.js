import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getInternshipWorkLogs = asyncHandler(async (req, res) => {
  if (req.user.userType?.toLowerCase() !== "ngo") {
    throw new ApiError(403, "Access denied");
  }

  const { internshipId, studentId } = req.params;

  const internship = await Internship.findOne({
    _id: internshipId,
    createdBy: req.user._id,
  }).populate("applicants.studentId", "name email prn department");

  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  const applicant = internship.applicants.find(
    (a) => a.studentId?._id?.toString() === studentId
  );

  if (!applicant) {
    throw new ApiError(404, "Student not found in this internship");
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
          _id: applicant.studentId._id,
          name: applicant.studentId.name,
          email: applicant.studentId.email,
          prn: applicant.studentId.prn,
          department: applicant.studentId.department,
        },
        internship: {
          _id: internship._id,
          title: internship.title,
          domain: internship.domain,
          startDate: internship.startDate,
          endDate: internship.endDate,
          totalDays,
          allowLateSubmissions: internship.allowLateSubmissions,
        },
        status: applicant.status,
        workLogs,
        totalLogs: workLogs.length,
      },
      "Work logs fetched successfully"
    )
  );
});
