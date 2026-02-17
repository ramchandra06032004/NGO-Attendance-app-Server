import { Event } from "../../models/events.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getRegisteredStudents = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        throw new ApiError(400, "Event ID is required");
    }

    // Fetch event with populated college and student data
    const event = await Event.findById(eventId)
        .populate({
            path: "colleges.collegeId",
            select: "name email logoUrl",
        })
        .populate({
            path: "colleges.students",
            select: "name prn email department classId",
            populate: {
                path: "classId",
                select: "className year",
            },
        });

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Verify the requesting NGO owns this event
    if (req.user.userType === "ngo" && event.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to view students for this event");
    }

    // Format response with college grouping
    const registeredStudents = event.colleges
        .filter((college) => college.students && college.students.length > 0)
        .map((college) => ({
            college: {
                _id: college.collegeId._id,
                name: college.collegeId.name,
                email: college.collegeId.email,
                logoUrl: college.collegeId.logoUrl,
            },
            students: college.students.map((student) => ({
                _id: student._id,
                name: student.name,
                prn: student.prn,
                email: student.email,
                department: student.department,
                class: student.classId ? {
                    _id: student.classId._id,
                    name: student.classId.className,
                    year: student.classId.year,
                } : null,
            })),
            studentCount: college.students.length,
        }));

    const totalStudents = registeredStudents.reduce(
        (sum, college) => sum + college.studentCount,
        0
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                event: {
                    _id: event._id,
                    aim: event.aim,
                    location: event.location,
                    eventDate: event.eventDate,
                },
                registeredStudents,
                totalStudents,
                totalColleges: registeredStudents.length,
            },
            "Registered students fetched successfully"
        )
    );
});
