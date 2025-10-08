import { Ngo } from "../../models/ngo";
import { Event } from "../../models/events";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

export const removeEvent = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo")
    throw new ApiError(403, "Access denied: Only NGOs can remove an event");

  const ngoUser = req.user;

  const { eventId } = req.params;
  // event existence check
  const eventExists = await Event.findById(eventId);
  if (!eventExists)
    throw new ApiError(404, "Event not found, maybe it was removed");

  // event belongs to ngo check
  if (!ngoUser.eventsId.includes(eventId))
    throw new ApiError(403, "Event does not belong to this NGO");

  // remove event
  await Event.findByIdAndDelete(eventId);

  // remove event form ngo Events array
  await Ngo.findByIdAndUpdate(ngoUser._id, {
    $pull: { eventsId: eventId },
  });

  res.status(200).json(new ApiResponse(200, [], "Event removed successfully"));
});
