import { Ngo } from "../../models/ngo.js";
import { Event } from "../../models/events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export default asyncHandler(async (req, res) => {
  const { ngoId } = req.params;
  // NGO existence check
  const ngoExists = await Ngo.findById(ngoId);
  if (!ngoExists) throw new ApiError(404, "NGO not found");

  // fetch events
  const events = await Event.find({ _id: { $in: ngoExists.eventsId } });

  res
    .status(200)
    .json(new ApiResponse(200, events, "Events fetched successfully"));
});
