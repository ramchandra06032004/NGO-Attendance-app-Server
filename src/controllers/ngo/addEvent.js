import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const addEvent = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo" && req.user.userType !== "branch_admin") {
    throw new ApiError(403, "Access denied: Only NGOs or Branch Admins can add events");
  }

  const ngoUser = req.user;

  const { location, aim, description, images, startDate, endDate, startTime, endTime, spocName, spocContact } =
    req.body;

  // Missing fields check
  if (!location || !aim || !description || !startDate || !endDate || !startTime || !endTime || !spocName || !spocContact)
    throw new ApiError(400, "Required fields are missing");

  // Date validation
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime()))
    throw new ApiError(400, "Invalid date format for startDate or endDate");

  if (parsedStartDate < new Date().setHours(0, 0, 0, 0))
    throw new ApiError(400, "Event start date cannot be in the past");

  if (parsedEndDate < parsedStartDate)
    throw new ApiError(400, "End date cannot be before start date");

  // String fields validation
  if (
    [location, aim, description, startTime, endTime, spocName, spocContact].some(
      (field) => typeof field !== "string" || !field.trim()
    )
  )
    throw new ApiError(400, "String fields must be non-empty strings");

  // Image array validation
  if (images && !Array.isArray(images))
    throw new ApiError(400, "Images must be an array");

  if (images && images.some((img) => typeof img !== "string" || !img.trim()))
    throw new ApiError(400, "Non-string element found in images array");

  const newEvent = await Event.create({
    location,
    aim,
    description,
    images: images || [],
    eventDate: parsedStartDate.toISOString(), // Legacy support
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    startTime,
    endTime,
    spocName,
    spocContact,
    createdBy: req.user.userType === "branch_admin" ? req.user.ngoId : req.user._id,
    branchId: req.user.userType === "branch_admin" ? req.user._id : undefined,
  });

  // add event id to NGO's events array
  const ngoId = req.user.userType === "branch_admin" ? req.user.ngoId : req.user._id;
  await Ngo.findByIdAndUpdate(ngoId, {
    $push: { eventsId: newEvent._id },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newEvent, "Event created successfully"));
});
