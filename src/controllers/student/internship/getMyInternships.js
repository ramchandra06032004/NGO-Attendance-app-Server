import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const getMyInternships = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Find all internships where this student has applied
  const internships = await Internship.find({
    "applicants.studentId": studentId,
  })
    .populate("createdBy", "name address profileImage")
    .sort({ createdAt: -1 });

  const now = new Date();

  const myInternships = internships.map((internship) => {
    const applicant = internship.applicants.find(
      (a) => a.studentId.toString() === studentId.toString()
    );

    const isCompleted =
      applicant?.status === "accepted" && internship.endDate < now;

    return {
      _id: internship._id,
      title: internship.title,
      description: internship.description,
      domain: internship.domain,
      location: internship.location,
      stipend: internship.stipend,
      startDate: internship.startDate,
      endDate: internship.endDate,
      spocName: internship.spocName,
      spocContact: internship.spocContact,
      createdBy: internship.createdBy,
      applicationStatus: applicant?.status || "pending",
      appliedAt: applicant?.appliedAt,
      isCompleted,
      workLogs: applicant?.workLogs || [],
      workLogsCount: applicant?.workLogs?.length || 0,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        internships: myInternships,
        count: myInternships.length,
      },
      "My internships fetched successfully"
    )
  );
});
