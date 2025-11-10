/**
 * GET ALL EVENT ATTENDANCE FOR NGO (CROSS-COLLEGE VIEW)
 *
 * PURPOSE:
 * This controller retrieves comprehensive attendance data for NGO users across ALL colleges
 * that participated in a specific event created by the NGO. This provides a complete overview
 * of event attendance for reporting and analytics purposes.
 *
 * USER ACCESS:
 * - NGO USERS ONLY: Can only view attendance for events they created
 * - CROSS-COLLEGE DATA: Returns attendance from all participating colleges in one response
 * - EVENT OWNERSHIP: NGOs can only access their own events (security enforced)
 *
 * ROUTE:
 * - NGO Route: GET /ngo/event/:eventId/attendance
 *
 * PARAMETERS:
 * - eventId (required): ID of the event to get attendance for
 *
 * RETURNS:
 * {
 *   statusCode: 200,
 *   data: {
 *     eventId: "event_object_id",
 *     event: {
 *       location: "event location",
 *       aim: "event purpose/description",
 *       eventDate: "YYYY-MM-DD"
 *     },
 *     colleges: [full college objects array],
 *     attendance: [
 *       {
 *         ...full student object,
 *         attendanceMarkedAt: "ISO timestamp when attendance was marked"
 *       }
 *     ],
 *     totalStudentsPresent: number (total across all colleges)
 *   },
 *   message: "Event attendance retrieved successfully"
 * }
 *
 * SPECIAL CASES:
 * - If no attendance found: Returns empty attendance array with totalStudentsPresent: 0
 * - Cross-college aggregation: All students from all participating colleges combined
 * - Optimized queries: Uses pre-organized student IDs for efficient database operations
 *
 * ERROR CASES:
 * - 400: Invalid event ID format
 * - 403:
 *   - User is not an NGO
 *   - NGO trying to access event created by another NGO
 * - 404: Event not found
 *
 * USE CASES:
 * - Generate attendance reports for NGO events
 * - Analytics and statistics for event success
 * - Cross-college attendance comparison
 * - Overall event participation tracking
 */

import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

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
          colleges: event.colleges.map((college) => college.collegeId),
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
  }).populate("classId", "className");

  // Format attendance data
  const attendanceData = attendedStudents.map((student) => {
    const eventAttendance = student.attendedEvents.find(
      (att) => att.eventId.toString() === eventId
    );

    return {
      ...student.toObject(),
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
        colleges: event.colleges.map((college) => college.collegeId),
        attendance: attendanceData,
        totalStudentsPresent: attendanceData.length,
      },
      "Event attendance retrieved successfully"
    )
  );
});
