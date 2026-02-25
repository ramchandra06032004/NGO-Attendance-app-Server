import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";

export const getMyEvents = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    // Find the student with populated attendedEvents
    const student = await Student.findById(studentId).populate(
        "attendedEvents.eventId",
        "aim location description eventDate"
    );

    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    // Find all events where this student is registered (in colleges.students array)
    const registeredEvents = await Event.find({
        "colleges.students": studentId,
    })
        .populate("createdBy", "name address profileImage")
        .sort({ eventDate: -1 }); // Most recent first

    // Create a map of attended event IDs for quick lookup
    const attendedEventIds = new Set(
        student.attendedEvents.map((ae) => ae.eventId._id.toString())
    );

    // Map events with their status
    const eventsWithStatus = registeredEvents.map((event) => {
        const isAttended = attendedEventIds.has(event._id.toString());
        return {
            ...event.toObject(),
            status: isAttended ? "Attended" : "Registered",
            attendanceMarkedAt: isAttended
                ? student.attendedEvents.find(
                    (ae) => ae.eventId._id.toString() === event._id.toString()
                )?.attendanceMarkedAt
                : null,
        };
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                events: eventsWithStatus,
                count: eventsWithStatus.length,
                attendedCount: eventsWithStatus.filter((e) => e.status === "Attended")
                    .length,
                registeredCount: eventsWithStatus.filter(
                    (e) => e.status === "Registered"
                ).length,
            },
            "Student events fetched successfully"
        )
    );
});
