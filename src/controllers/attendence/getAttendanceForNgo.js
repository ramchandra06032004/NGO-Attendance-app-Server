import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

// Get attendance for NGO using pre-organized Event data
export const getEventAttendanceForNGO = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const ngoId = req.user._id;

  // Authorization check
  if (req.user.userType !== "ngo") {
    throw new ApiError(
      403,
      "Access denied: Only NGOs can access this endpoint"
    );
  }

  // Get event with populated college data
  const event = await Event.findById(eventId).populate({
    path: "colleges.collegeId",
    select: "name",
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.createdBy.toString() !== ngoId.toString()) {
    throw new ApiError(
      403,
      "You can only view attendance for events you created"
    );
  }

  // Get all student IDs from all colleges in the event
  const allStudentIds = [];
  event.colleges.forEach((college) => {
    allStudentIds.push(...college.students);
  });

  if (allStudentIds.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          eventId,
          event: {
            location: event.location,
            aim: event.aim,
            eventDate: event.eventDate,
          },
          attendance: [],
          totalStudentsPresent: 0,
        },
        "No attendance found for this event"
      )
    );
  }

  // Fetch students directly using pre-organized IDs
  const attendedStudents = await Student.find({
    _id: { $in: allStudentIds },
  })
    .populate("classId", "className")
    .select("name prn attendedEvents");

  // Format attendance data
  const attendanceData = attendedStudents.map((student) => {
    const eventAttendance = student.attendedEvents.find(
      (att) => att.eventId.toString() === eventId
    );

    return {
      studentId: student._id,
      name: student.name,
      prn: student.prn,
      className: student.classId.className,
      attendanceMarkedAt: eventAttendance
        ? eventAttendance.attendanceMarkedAt
        : null,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        eventId,
        event: {
          location: event.location,
          aim: event.aim,
          eventDate: event.eventDate,
        },
        attendance: attendanceData,
        totalStudentsPresent: attendanceData.length,
      },
      "Event attendance retrieved successfully"
    )
  );
});
