import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Internship } from "../../models/internship.js";
import { Branch } from "../../models/branch.js";

// GET /ngo/branches/:branch_id/events
export const getBranchEvents = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo") {
    throw new ApiError(403, "Only NGO Super Admin can access this");
  }

  const { branch_id } = req.params;

  // Verify branch belongs to this NGO
  const branch = await Branch.findOne({ _id: branch_id, ngoId: req.user._id });
  if (!branch) {
    throw new ApiError(404, "Branch not found or does not belong to your NGO");
  }

  const events = await Event.find({ branchId: branch_id })
    .select("aim location startDate endDate createdAt colleges")
    .sort({ createdAt: -1 });

  const formatted = events.map((e) => ({
    _id: e._id,
    title: e.aim,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    createdAt: e.createdAt,
    totalColleges: e.colleges?.length || 0,
    totalRegistered: e.colleges?.reduce((sum, c) => sum + (c.students?.length || 0), 0) || 0,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Branch events fetched"));
});

// GET /ngo/branches/:branch_id/internships
export const getBranchInternships = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo") {
    throw new ApiError(403, "Only NGO Super Admin can access this");
  }

  const { branch_id } = req.params;

  // Verify branch belongs to this NGO
  const branch = await Branch.findOne({ _id: branch_id, ngoId: req.user._id });
  if (!branch) {
    throw new ApiError(404, "Branch not found or does not belong to your NGO");
  }

  const internships = await Internship.find({ branchId: branch_id })
    .select("title domain location startDate endDate totalSlots applicants createdAt")
    .sort({ createdAt: -1 });

  const formatted = internships.map((i) => ({
    _id: i._id,
    title: i.title,
    domain: i.domain,
    location: i.location,
    startDate: i.startDate,
    endDate: i.endDate,
    totalSlots: i.totalSlots,
    totalApplicants: i.applicants?.length || 0,
    acceptedCount: i.applicants?.filter((a) => a.status === "accepted").length || 0,
    createdAt: i.createdAt,
  }));

  return res.status(200).json(new ApiResponse(200, formatted, "Branch internships fetched"));
});
