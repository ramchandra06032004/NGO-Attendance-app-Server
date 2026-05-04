import { Event } from "../../models/events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getEvents = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo" && req.user.userType !== "branch_admin") {
    throw new ApiError(
      403,
      "Access denied: Only NGOs or Branch Admins can access this resource"
    );
  }

  // fetch events
  let events;
  if (req.user.userType === "branch_admin") {
    events = await Event.find({ branchId: req.user._id });
  } else {
    // Super Admin or regular NGO
    events = await Event.find({ createdBy: req.user._id });
  }

  res
    .status(200)
    .json(new ApiResponse(200, events, "Events fetched successfully"));
});
