import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

export const registerForEvent = asyncHandler(async (req, res) => {
    const { eventId } = req.body;
    const studentId = req.user._id;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    // Find the student to get their classId
    const student = await Student.findById(studentId);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    if (!student.classId) {
        throw new ApiError(400, "Student's class information is missing");
    }

    // Find the college that contains this class
    const college = await College.findOne({ classes: student.classId });
    if (!college) {
        throw new ApiError(404, "College not found for this student");
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Check if the student's college is already in the event's colleges array
    const collegeIndex = event.colleges.findIndex(
        (c) => c.collegeId.toString() === college._id.toString()
    );

    if (collegeIndex === -1) {
        // College not in event, add it with the student
        event.colleges.push({
            collegeId: college._id,
            students: [studentId],
        });
    } else {
        // College exists, check if student is already registered
        const isAlreadyRegistered = event.colleges[collegeIndex].students.some(
            (id) => id.toString() === studentId.toString()
        );

        if (isAlreadyRegistered) {
            throw new ApiError(400, "You are already registered for this event");
        }

        // Add student to the college's students array
        event.colleges[collegeIndex].students.push(studentId);
    }

    await event.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                event,
            },
            "Successfully registered for event"
        )
    );
});

