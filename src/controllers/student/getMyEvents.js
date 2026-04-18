import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
 
// Helper: convert a Date or date-string to a "YYYY-MM-DD" string in local time
function toDateString(date) {
    if (!date) return null;
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export const getMyEvents = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    // Find the student with populated attendedEvents
    const student = await Student.findById(studentId).populate(
        "attendedEvents.eventId",
        "aim location description eventDate startDate endDate startTime endTime spocName spocContact"
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
        // Find ALL attendance records for this event for this student
        const myAttendanceForEvent = student.attendedEvents.filter(
            (ae) => ae.eventId?._id?.toString() === event._id.toString()
        );

        const isAttended = myAttendanceForEvent.length > 0;
        
        return {
            ...event.toObject(),
            status: isAttended ? "Attended" : "Registered",
            attendanceRecords: myAttendanceForEvent.map(att => ({
                // Fallback for legacy data: if attendanceDate is missing, use event start/event date
                attendanceDate: att.attendanceDate || toDateString(event.startDate || event.eventDate),
                attendanceMarkedAt: att.attendanceMarkedAt
            })),
            // Keep legacy field for backward compatibility if needed by some UI
            attendanceMarkedAt: isAttended ? myAttendanceForEvent[0].attendanceMarkedAt : null,
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
