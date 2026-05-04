import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const removeEvent = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo" && req.user.userType !== "branch_admin")
    throw new ApiError(403, "Access denied: Only NGOs can remove an event");

  const { eventId } = req.body;
  const isBranchAdmin = req.user.userType === "branch_admin";

  const query = isBranchAdmin 
    ? { _id: eventId, branchId: req.user._id }
    : { _id: eventId, createdBy: req.user._id };

  const event = await Event.findOne(query);
  if (!event) {
    throw new ApiError(403, "Event not found or you don't have permission to remove this event");
  }

  // Determine the parent NGO ID to update their eventsId list
  const ngoId = isBranchAdmin ? req.user.ngoId : req.user._id;

  // remove event from ngo Events array
  await Ngo.findByIdAndUpdate(ngoId, {
    $pull: { eventsId: eventId },
  });

  // Also delete the event itself from the Event collection
  await Event.findByIdAndDelete(eventId);

  res.status(200).json(new ApiResponse(200, [], "Event removed successfully"));
});
