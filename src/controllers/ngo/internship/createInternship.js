import { asyncHandler } from "../../../utils/asyncHandler.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { Internship } from "../../../models/internship.js";

export const createInternship = asyncHandler(async (req, res) => {
  // Only NGO Super Admin can create internships
  if (req.user.userType?.toLowerCase() !== "ngo") {
    throw new ApiError(403, "Access denied: Only NGO Super Admins can create internships");
  }

  const ngoId = req.user._id;

  const {
    title,
    description,
    domain,
    location,
    stipend,
    totalSlots,
    startDate,
    endDate,
    spocName,
    spocContact,
  } = req.body;

  if (
    !title ||
    !description ||
    !domain ||
    !location ||
    !totalSlots ||
    !startDate ||
    !endDate ||
    !spocName ||
    !spocContact
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
    throw new ApiError(400, "Invalid date format for startDate or endDate");
  }

  if (parsedEndDate <= parsedStartDate) {
    throw new ApiError(400, "End date must be after start date");
  }

  if (typeof totalSlots !== "number" || totalSlots < 1) {
    throw new ApiError(400, "totalSlots must be a positive number");
  }

  const internship = await Internship.create({
    title,
    description,
    domain,
    location,
    stipend: stipend || "Unpaid",
    totalSlots,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    spocName,
    spocContact,
    createdBy: ngoId,
    // null = NGO-wide (visible to all branches); a specific id = branch-only
    branchId: req.body.branchId || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, internship, "Internship created successfully"));
});
