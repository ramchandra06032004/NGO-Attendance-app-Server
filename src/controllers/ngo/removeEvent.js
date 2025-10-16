import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const removeEvent = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo")
    throw new ApiError(403, "Access denied: Only NGOs can remove an event");

  const ngoUser = req.user;

  const { eventId } = req.body;
  // event existence check
  const eventExists = await Event.findById(eventId);
  if (!eventExists) throw new ApiError(404, "Event not found");

  // event belongs to ngo check
  if (!ngoUser.eventsId.includes(eventId))
    throw new ApiError(
      403,
      "Event does not belong to this NGO, may be it was removed"
    );

  // remove event from ngo Events array
  await Ngo.findByIdAndUpdate(ngoUser._id, {
    $pull: { eventsId: eventId },
  });

  res.status(200).json(new ApiResponse(200, [], "Event removed successfully"));
});
