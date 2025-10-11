/**
 * GET EVENT ATTENDANCE FOR SPECIFIC COLLEGE
 *
 * PURPOSE:
 * This controller retrieves attendance data for a specific college for a particular event.
 * It handles different user types (College and NGO) with different access patterns.
 *
 * USER ACCESS:
 * - COLLEGE USERS: Can only view attendance for their own college (uses their user ID automatically)
 * - NGO USERS: Can view attendance for any college by specifying college ID in route parameter
 *
 * ROUTES:
 * - College Route: GET /college/event/:eventId/attendance (no collegeId needed)
 * - NGO Route: GET /ngo/event/:eventId/college/:collegeId/attendance (collegeId required)
 *
 * PARAMETERS:
 * - eventId (required): ID of the event to get attendance for
 * - collegeId (required for NGO, auto-filled for College): ID of the college
 *
 * RETURNS:
 * {
 *   statusCode: 200,
 *   data: {
 *     eventId: "event_object_id",
 *     event: {
 *       location: "event location",
 *       aim: "event purpose",
 *       eventDate: "YYYY-MM-DD",
 *       createdBy: "ngo_object_id"
 *     },
 *     attendance: [
 *       {
 *         _id: "college_object_id",
 *         collegeName: "College Name",
 *         students: [
 *           {
 *             studentId: "student_object_id",
 *             name: "Student Name",
 *             prn: "Student PRN",
 *             className: "Class Name",
 *             attendanceMarkedAt: "timestamp or null"
 *           }
 *         ],
 *         totalStudents: number
 *       }
 *     ],
 *     totalColleges: 1 (always 1 for specific college),
 *     totalStudentsPresent: number
 *   },
 *   message: "Event attendance retrieved successfully"
 * }
 *
 * ERROR CASES:
 * - 400: Invalid event ID or college ID
 * - 403: Unauthorized user type or access denied
 * - 404: Event not found or college not found
 */

import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

export const getEventAttendanceForCollege = asyncHandler(async (req, res) => {
  if (req.user.userType !== "college" && req.user.userType !== "ngo") {
    throw new ApiError(
      403,
      "Access denied: Only colleges and NGOs can access this endpoint"
    );
  }

  if (req.user == undefined) {
    throw new ApiError(403, "Access denied: Unauthorized user");
  }

  const { eventId, collegeId } = req.params;
  const userType = req.user.userType;
  const userId = req.user._id;

  // Validate required parameters
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  // Determine college ID based on user type
  let finalCollegeId;
  if (userType === "college") {
    // For college users, use their own ID from req.user._id
    finalCollegeId = userId.toString();
  } else if (userType === "ngo") {
    // For NGO users, get college ID from route parameters
    if (!collegeId) {
      throw new ApiError(400, "College ID is required for NGO users");
    }
    if (!mongoose.Types.ObjectId.isValid(collegeId)) {
      throw new ApiError(400, "Invalid college ID");
    }
    finalCollegeId = collegeId;
  } else {
    throw new ApiError(403, "Access denied: Invalid user type");
  }

  // Get event with populated college data
  const event = await Event.findById(eventId).populate({
    path: "colleges.collegeId",
    select: "name",
  });

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  let attendanceData = [];

  if (finalCollegeId) {
    // Find specific college in event data
    const eventCollege = event.colleges.find(
      (college) => college.collegeId._id.toString() === finalCollegeId
    );

    if (!eventCollege) {
      // College exists but no attendance marked yet
      const college = await College.findById(finalCollegeId);
      if (!college) {
        throw new ApiError(404, "College not found");
      }

      attendanceData = [
        {
          _id: college._id,
          collegeName: college.name,
          students: [],
          totalStudents: 0,
        },
      ];
    } else {
      // OPTIMIZED: Get students directly using the pre-organized student IDs
      const students = await Student.find({
        _id: { $in: eventCollege.students },
      })
        .populate("classId", "className")
        .select("name prn attendedEvents");

      // Format student data with attendance info
      const studentData = students.map((student) => {
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

      attendanceData = [
        {
          _id: eventCollege.collegeId._id,
          collegeName: eventCollege.collegeId.name,
          students: studentData,
          totalStudents: studentData.length,
        },
      ];
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        eventId,
        event: {
          location: event.location,
          aim: event.aim,
          eventDate: event.eventDate,
          createdBy: event.createdBy,
        },
        attendance: attendanceData,
        totalColleges: attendanceData.length,
        totalStudentsPresent: attendanceData.reduce(
          (sum, college) => sum + college.totalStudents,
          0
        ),
      },
      "Event attendance retrieved successfully"
    )
  );
});
