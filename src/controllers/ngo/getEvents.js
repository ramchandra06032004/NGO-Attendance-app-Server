import { Event } from "../../models/events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getEvents = asyncHandler(async (req, res) => {
  
  if (req.user.userType !== "ngo") {
    throw new ApiError(
      403,
      "Access denied: Only NGOs can access this resource"
    );
  }

  const ngoUser = req.user;

  // fetch events
  const events = await Event.find({ _id: { $in: ngoUser.eventsId } });

  res
    .status(200)
    .json(new ApiResponse(200, events, "Events fetched successfully"));
});
