import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getInternshipApplicants = asyncHandler(async (req, res) => {
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

  // Build scoped query: branch admins can only access their branch + NGO-wide internships
  const internshipQuery = userType === "ngo"
    ? { _id: internshipId, createdBy: ngoId }
    : { _id: internshipId, createdBy: ngoId, $or: [{ branchId: req.user._id }, { branchId: null }] };

  const internship = await Internship.findOne(internshipQuery).populate("applicants.studentId", "name email prn department");

  if (!internship) {
    throw new ApiError(404, "Internship not found");
  }

  const startDate = new Date(internship.startDate);
  const endDate = new Date(internship.endDate);
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  const applicants = internship.applicants.map((applicant) => ({
    _id: applicant._id,
    studentId: applicant.studentId?._id,
    name: applicant.studentId?.name,
    email: applicant.studentId?.email,
    prn: applicant.studentId?.prn,
    department: applicant.studentId?.department,
    status: applicant.status,
    appliedAt: applicant.appliedAt,
    workLogsCount: applicant.workLogs?.length || 0,
    isCompleted: applicant.status === "accepted" && (applicant.workLogs?.length || 0) >= totalDays,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        internship: {
          _id: internship._id,
          title: internship.title,
          domain: internship.domain,
          startDate: internship.startDate,
          endDate: internship.endDate,
          totalSlots: internship.totalSlots,
          totalDays,
          allowLateSubmissions: internship.allowLateSubmissions,
        },
        applicants,
      },
      "Applicants fetched successfully"
    )
  );
});
