//The attendance will get to the particular college student only
//Like college name is ABC then the attendance will get to the student of ABC college only
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

// Using pre-organized Event model data
export const getEventAttendanceByCollege = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { collegeId } = req.query;
  const userType = req.user.userType;
  const userId = req.user._id;

  if (req.user == undefined) {
    throw new ApiError(403, "Access denied: Unauthorized user");
  }

  // Validate required parameters
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  // If college user, they can only see their own college's attendance
  let finalCollegeId = collegeId;
  if (userType === "college") {
    finalCollegeId = userId.toString(); // College user can only see their own data
  }

  if (userType === "college" && userId.toString() !== finalCollegeId) {
    throw new ApiError(
      403,
      "Access denied: Cannot access other college's data"
    );
  }

  if (finalCollegeId && !mongoose.Types.ObjectId.isValid(finalCollegeId)) {
    throw new ApiError(400, "Invalid college ID");
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
  } else {
    // Get all colleges' attendance data
    if (event.colleges.length === 0) {
      attendanceData = [];
    } else {
      // Process each college in the event
      for (const eventCollege of event.colleges) {
        // OPTIMIZED: Get students directly using pre-organized student IDs
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

        attendanceData.push({
          _id: eventCollege.collegeId._id,
          collegeName: eventCollege.collegeId.name,
          students: studentData,
          totalStudents: studentData.length,
        });
      }

      // Sort by college name
      attendanceData.sort((a, b) => a.collegeName.localeCompare(b.collegeName));
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

