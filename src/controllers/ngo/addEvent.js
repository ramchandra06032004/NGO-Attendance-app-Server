import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export default asyncHandler(async (req, res) => {
  const { ngoId } = req.params;
  // NGO existence check
  const ngoExists = await Ngo.findById(ngoId);
  if (!ngoExists) throw new ApiError(404, "NGO not found");

  const { location, aim, description, images, eventDate, collegeName } =
    req.body;

  // Missing fields check
  if (!location || !aim || !description || !eventDate || !collegeName)
    throw new ApiError(400, "Required fields are missing");

  // Date validation
  const parsedDate = new Date(eventDate);
  if (isNaN(parsedDate.getTime()))
    throw new ApiError(400, "Invalid date format for eventDate");

  if (parsedDate < new Date())
    throw new ApiError(400, "Event date cannot be in the past");

  // String fields validation
  if (
    [location, aim, description, collegeName].some(
      (field) => typeof field !== "string" || !field.trim()
    )
  )
    throw new ApiError(400, "String fields must be non-empty strings");

  // Image array validation
  if (images && !Array.isArray(images))
    throw new ApiError(400, "Images must be an array");

  if (images && images.some((img) => typeof img !== "string" || !img.trim()))
    throw new ApiError(400, "Non-string element found in images array");

  // Find collegeId by collegeName
  const college = await College.findOne({ name: collegeName });
  if (!college) throw new ApiError(404, "College not found");
  const collegeId = college._id;

  const newEvent = await Event.create({
    location,
    aim,
    description,
    images: images || [],
    eventDate: parsedDate.toISOString(),
    college: collegeId,
  });

  // add event id to NGO's events array
  await Ngo.findByIdAndUpdate(ngoId, { $push: { eventsId: newEvent._id } });

  res
    .status(201)
    .json(new ApiResponse(201, newEvent, "Event created successfully"));
});
