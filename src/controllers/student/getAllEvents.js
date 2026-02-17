import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";

export const getAllEvents = asyncHandler(async (req, res) => {
    // Get all events and populate NGO details
    const events = await Event.find({})
        .populate("createdBy", "name address profileImage")
        .sort({ eventDate: 1 }); // Sort by event date, upcoming first

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                events,
                count: events.length,
            },
            "Events fetched successfully"
        )
    );
});
