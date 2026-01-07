import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { College } from "../../models/college.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { generateQR } from "../../utils/generateQR/generateQR.js";

export const addEvent = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo") {
    throw new ApiError(403, "Access denied: Only NGOs can add events");
  }

  const ngoUser = req.user;

  // Extract coordinates from request body
  const { location, aim, description, images, eventDate, coordinates } =
    req.body;

  // Missing fields check
  if (!location || !aim || !description || !eventDate)
    throw new ApiError(400, "Required fields are missing");

  // Validate coordinates
  if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
    throw new ApiError(400, "Event coordinates (latitude and longitude) are required");
  }

  // Date validation
  const parsedDate = new Date(eventDate);
  if (isNaN(parsedDate.getTime()))
    throw new ApiError(400, "Invalid date format for eventDate");

  if (parsedDate < new Date())
    throw new ApiError(400, "Event date cannot be in the past");

  // String fields validation
  if (
    [location, aim, description].some(
      (field) => typeof field !== "string" || !field.trim()
    )
  )
    throw new ApiError(400, "String fields must be non-empty strings");

  // Image array validation
  if (images && !Array.isArray(images))
    throw new ApiError(400, "Images must be an array");

  if (images && images.some((img) => typeof img !== "string" || !img.trim()))
    throw new ApiError(400, "Non-string element found in images array");

  const qrCodeString = generateQR();

  const newEvent = await Event.create({
    location,
    aim,
    description,
    images: images || [],
    eventDate: parsedDate.toISOString(),
    coordinates: {
      type: 'Point',
      coordinates: [
        parseFloat(coordinates.longitude),
        parseFloat(coordinates.latitude)
      ]
    },
    createdBy: ngoUser._id,
    currAttendanceString: qrCodeString,
  });

  // add event id to NGO's events array
  await Ngo.findByIdAndUpdate(ngoUser._id, {
    $push: { eventsId: newEvent._id },
  });

  res
    .status(201)
    .json(new ApiResponse(201, newEvent, "Event created successfully"));
});
