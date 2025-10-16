import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

// UPDATED APPROACH: Mark attendance with college validation and event model update
export const markAttendance = asyncHandler(async (req, res) => {
  // Authorization check
  if (req.user.userType !== "ngo") {
    throw new ApiError(403, "Access denied: Only NGOs can mark attendance");
  }

  const { studentIds, eventId, collegeId } = req.body;
  const ngoId = req.user._id;

  if (!eventId) {
    throw new ApiError(400, "Event ID is required");
  }
  if (!collegeId) {
    throw new ApiError(400, "College ID is required");
  }

  // Input validation
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, "studentIds must be a non-empty array");
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid event ID");
  }

  if (!mongoose.Types.ObjectId.isValid(collegeId)) {
    throw new ApiError(400, "Invalid college ID");
  }

  const invalidStudentIds = studentIds.filter(
    (id) => !mongoose.Types.ObjectId.isValid(id)
  );
  if (invalidStudentIds.length > 0) {
    throw new ApiError(
      400,
      `Invalid student IDs: ${invalidStudentIds.join(", ")}`
    );
  }

  // Fetch the event and verify NGO ownership
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.createdBy.toString() !== ngoId.toString()) {
    throw new ApiError(
      403,
      "You can only mark attendance for events you created"
    );
  }

  // Verify college exists
  const college = await College.findById(collegeId).populate({
    path: "classes",
    populate: {
      path: "students",
      select: "_id name prn attendedEvents",
    },
  });

  if (!college) {
    throw new ApiError(404, "College not found");
  }

  // Get all student IDs that belong to this college
  const collegeStudentIds = [];
  college.classes.forEach((classObj) => {
    classObj.students.forEach((student) => {
      collegeStudentIds.push(student._id.toString());
    });
  });

  // Validate that all provided student IDs belong to the specified college
  const invalidStudents = studentIds.filter(
    (id) => !collegeStudentIds.includes(id)
  );
  if (invalidStudents.length > 0) {
    throw new ApiError(
      400,
      `These students do not belong to the specified college: ${invalidStudents.join(", ")}`
    );
  }

  // Fetch students - simple and fast
  const students = await Student.find({
    _id: { $in: studentIds },
  });

  if (students.length !== studentIds.length) {
    const foundIds = students.map((s) => s._id.toString());
    const missingIds = studentIds.filter((id) => !foundIds.includes(id));
    throw new ApiError(404, `Students not found: ${missingIds.join(", ")}`);
  }

  // Prepare bulk operations for better performance
  const bulkOps = [];
  const attendanceMarkedAt = new Date();
  const attendanceResults = {
    marked: [],
    alreadyMarked: [],
    errors: [],
  };

  for (const student of students) {
    // Check if attendance for this event is already marked
    const alreadyMarked = student.attendedEvents.some(
      (attendedEvent) => attendedEvent.eventId.toString() === eventId
    );

    if (alreadyMarked) {
      attendanceResults.alreadyMarked.push({
        studentId: student._id,
        name: student.name,
        prn: student.prn,
      });
    } else {
      // Add to bulk operations
      bulkOps.push({
        updateOne: {
          filter: { _id: student._id },
          update: {
            $push: {
              attendedEvents: {
                eventId,
                attendanceMarkedAt,
                markedBy: { ngoId },
              },
            },
          },
        },
      });

      attendanceResults.marked.push({
        studentId: student._id,
        name: student.name,
        prn: student.prn,
      });
    }
  }

  // Execute bulk operations for better performance
  if (bulkOps.length > 0) {
    await Student.bulkWrite(bulkOps);
  }

  // Update Event model with college and student information
  if (attendanceResults.marked.length > 0) {
    // Check if this college already exists in the event
    const existingCollegeIndex = event.colleges.findIndex(
      (college) => college.collegeId.toString() === collegeId
    );

    const newStudentIds = attendanceResults.marked.map(
      (student) => student.studentId
    );

    if (existingCollegeIndex !== -1) {
      // College exists, add new students to the existing array (avoid duplicates)
      const existingStudentIds = event.colleges[
        existingCollegeIndex
      ].students.map((id) => id.toString());

      const studentsToAdd = newStudentIds.filter(
        (id) => !existingStudentIds.includes(id.toString())
      );

      if (studentsToAdd.length > 0) {
        await Event.findByIdAndUpdate(eventId, {
          $push: {
            [`colleges.${existingCollegeIndex}.students`]: {
              $each: studentsToAdd,
            },
          },
        });
      }
    } else {
      // College doesn't exist, create new college entry
      await Event.findByIdAndUpdate(eventId, {
        $push: {
          colleges: {
            collegeId: collegeId,
            students: newStudentIds,
          },
        },
      });
    }
  }

  // Prepare response
  const responseData = {
    eventId,
    collegeId,
    collegeName: college.name,
    totalStudents: studentIds.length,
    newlyMarked: attendanceResults.marked.length,
    alreadyMarked: attendanceResults.alreadyMarked.length,
    attendanceDetails: attendanceResults,
    markedAt: attendanceMarkedAt,
  };

  const message = `Attendance processed for ${college.name}: ${attendanceResults.marked.length} newly marked, ${attendanceResults.alreadyMarked.length} already marked`;

  return res.status(200).json(new ApiResponse(200, responseData, message));
});
