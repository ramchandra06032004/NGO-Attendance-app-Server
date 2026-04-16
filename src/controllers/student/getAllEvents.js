import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";

export const getAllEvents = asyncHandler(async (req, res) => {
    // Get all events and populate NGO details
    const events = await Event.find({})
        .populate("createdBy", "name address profileImage")
        .sort({ eventDate: 1 }); // Sort by event date, upcoming first

    const studentIdStr = req.user._id.toString();

    // Attach isRegistered flag
    const eventsWithStatus = events.map(event => {
        let isRegistered = false;
        if (event.colleges && Array.isArray(event.colleges)) {
            for (const c of event.colleges) {
                if (c.students && Array.isArray(c.students)) {
                    if (c.students.some(sId => sId.toString() === studentIdStr)) {
                        isRegistered = true;
                        break;
                    }
                }
            }
        }
        return {
            ...event.toObject(),
            isRegistered
        };
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                events: eventsWithStatus,
                count: eventsWithStatus.length,
            },
            "Events fetched successfully"
        )
    );
});
