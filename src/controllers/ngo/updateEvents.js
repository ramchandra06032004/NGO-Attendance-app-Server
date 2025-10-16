import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";

export const updateEvents = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo") {
    throw new ApiError(403, "Access denied: Only NGOs can update events");
  }
  const ngoUser = req.user;
  const {
    location,
    aim,
    description,
    images,
    eventDate,
    collegeName,
    eventId,
  } = req.body;

  // Validation
  if (!eventId) {
    throw new ApiError(400, "Event ID is required");
  }

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid event ID format");
  }

  if (
    !location &&
    !aim &&
    !description &&
    !images &&
    !eventDate &&
    !collegeName
  ) {
    throw new ApiError(400, "At least one field is required to update");
  }

  // Debug: Check if event exists at all first
  const eventExists = await Event.findById(eventId);
  if (!eventExists) {
    throw new ApiError(404, "Event with this ID does not exist");
  }

  // Debug: Log the IDs for comparison
  console.log("🔍 Event ID:", eventId);
  console.log("🔍 Event createdBy:", eventExists.createdBy);
  console.log("🔍 Current NGO user ID:", ngoUser._id);
  console.log("🔍 CreatedBy exists:", !!eventExists.createdBy);
  console.log("🔍 NGO ID exists:", !!ngoUser._id);

  // Safe comparison
  const createdByStr = eventExists.createdBy
    ? eventExists.createdBy.toString()
    : null;
  const ngoIdStr = ngoUser._id ? ngoUser._id.toString() : null;
  console.log("🔍 IDs match:", createdByStr === ngoIdStr);

  // Check if event belongs to the current NGO
  const event = await Event.findOne({ _id: eventId, createdBy: ngoUser._id });
  if (!event) {
    throw new ApiError(
      403,
      "Event not found or you don't have permission to update this event"
    );
  }

  // Update event
  event.set({
    location: location || event.location,
    aim: aim || event.aim,
    description: description || event.description,
    images: images || event.images,
    eventDate: eventDate || event.eventDate,
    collegeName: collegeName || event.collegeName,
  });
  await event.save();

  // Send response
  res
    .status(200)
    .json(new ApiResponse(200, "Event updated successfully", event));
});
