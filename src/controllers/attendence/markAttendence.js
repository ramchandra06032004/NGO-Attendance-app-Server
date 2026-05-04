import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { Event } from "../../models/events.js";
import { Student } from "../../models/student.js";
import { College } from "../../models/college.js";

// Helper: convert a Date or date-string to a "YYYY-MM-DD" string in local time
function toDateString(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Mark attendance with multi-day support and college validation
export const markAttendance = asyncHandler(async (req, res) => {
  // Authorization check
  if (req.user.userType !== "ngo" && req.user.userType !== "branch_admin") {
    throw new ApiError(403, "Access denied: Only NGOs can mark attendance");
  }

  const { studentIds, eventId, collegeId, attendanceDate } = req.body;
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

  const isBranchAdmin = req.user.userType === "branch_admin";
  const isOwner = isBranchAdmin 
    ? event.branchId?.toString() === req.user._id.toString()
    : event.createdBy.toString() === req.user._id.toString();

  if (!isOwner) {
    throw new ApiError(
      403,
      "You can only mark attendance for events you created"
    );
  }

  // ── Date validation ────────────────────────────────────────────────────────
  const eventStart = new Date(event.startDate || event.eventDate);
  eventStart.setHours(0, 0, 0, 0);

  const eventEnd = new Date(event.endDate || event.startDate || event.eventDate);
  eventEnd.setHours(23, 59, 59, 999);

  // Determine which date we are marking for
  let markDate; // will be a "YYYY-MM-DD" string
  if (attendanceDate) {
    const parsed = new Date(attendanceDate);
    if (isNaN(parsed.getTime())) {
      throw new ApiError(400, "Invalid attendanceDate format. Use YYYY-MM-DD.");
    }
    parsed.setHours(0, 0, 0, 0);

    // Must be within the event schedule
    if (parsed < eventStart || parsed > eventEnd) {
      throw new ApiError(
        400,
        `Attendance can only be marked for dates within the event schedule (${toDateString(eventStart)} to ${toDateString(eventEnd)}).`
      );
    }

    // Must not be in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsed > today) {
      throw new ApiError(
        400,
        `Attendance cannot be marked for a future date (${toDateString(parsed)}).`
      );
    }

    markDate = toDateString(parsed);
  } else {
    // Fallback: use today's date (single-day / legacy support)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate < eventStart) {
      throw new ApiError(
        400,
        `Attendance marking has not started yet. You can start marking from ${toDateString(eventStart)}.`
      );
    }

    if (currentDate > eventEnd) {
      throw new ApiError(
        400,
        `Attendance marking has ended. The event ran from ${toDateString(eventStart)} to ${toDateString(eventEnd)}.`
      );
    }

    markDate = toDateString(currentDate);
  }
  // ──────────────────────────────────────────────────────────────────────────

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

  // Fetch students
  const students = await Student.find({
    _id: { $in: studentIds },
  });

  if (students.length !== studentIds.length) {
    const foundIds = students.map((s) => s._id.toString());
    const missingIds = studentIds.filter((id) => !foundIds.includes(id));
    throw new ApiError(404, `Students not found: ${missingIds.join(", ")}`);
  }

  // Prepare bulk operations
  const bulkOps = [];
  const attendanceMarkedAt = new Date();
  const attendanceResults = {
    marked: [],
    alreadyMarked: [],
    errors: [],
  };

  for (const student of students) {
    // Check if attendance for this specific event day is already marked
    const alreadyMarked = student.attendedEvents.some((attendedEvent) => {
      if (attendedEvent.eventId.toString() !== eventId) return false;
      // If this is a multi-day event and both records have attendanceDate, compare dates
      if (attendedEvent.attendanceDate && markDate) {
        return attendedEvent.attendanceDate === markDate;
      }
      // Legacy single-day: if no attendanceDate recorded, treat as already marked for that event
      return !attendedEvent.attendanceDate;
    });

    if (alreadyMarked) {
      attendanceResults.alreadyMarked.push({
        studentId: student._id,
        name: student.name,
        prn: student.prn,
      });
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: student._id },
          update: {
            $push: {
              attendedEvents: {
                eventId,
                attendanceDate: markDate,
                attendanceMarkedAt,
                markedBy: {
                  ngoId: req.user.userType === "branch_admin" ? req.user.ngoId : req.user._id,
                  branchId: req.user.userType === "branch_admin" ? req.user._id : undefined,
                },
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

  // Execute bulk operations
  if (bulkOps.length > 0) {
    await Student.bulkWrite(bulkOps);
  }

  // Update Event model with college and student information (distinct list across all days)
  if (attendanceResults.marked.length > 0) {
    const existingCollegeIndex = event.colleges.findIndex(
      (college) => college.collegeId.toString() === collegeId
    );

    const newStudentIds = attendanceResults.marked.map(
      (student) => student.studentId
    );

    if (existingCollegeIndex !== -1) {
      // College exists; add new students to the set (avoid duplicates across days)
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
      // New college entry
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
    attendanceDate: markDate,
    totalStudents: studentIds.length,
    newlyMarked: attendanceResults.marked.length,
    alreadyMarked: attendanceResults.alreadyMarked.length,
    attendanceDetails: attendanceResults,
    markedAt: attendanceMarkedAt,
  };

  const message = `Attendance processed for ${college.name} on ${markDate}: ${attendanceResults.marked.length} newly marked, ${attendanceResults.alreadyMarked.length} already marked`;

  return res.status(200).json(new ApiResponse(200, responseData, message));
});
