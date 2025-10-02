import Class from "../models/class.js";
import College from "../models/college.js";
import Student from "../models/student.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const validateStringField = (field, fieldName, index) => {
  if (!field || typeof field !== "string" || !field.trim()) {
    throw new ApiError(
      400,
      `Student at index ${index}: ${fieldName} must be a non-empty string`
    );
  }
};

export default asyncHandler(async (req, res) => {
  const { collegeId, classId } = req.params;

  // college existence check
  const collegeExists = await College.findById(collegeId);
  if (!collegeExists) throw new ApiError(404, "College not found");

  // class existence check
  const classExists = await Class.findById(classId);
  if (!classExists) throw new ApiError(404, "Class not found");

  // class belongs to college check
  if (!collegeExists.classes.includes(classId)) {
    throw new ApiError(403, "Class does not belong to this college");
  }

  // get all student IDs in this college (optimized)
  const allStudentIdsInCollege = await Class.aggregate([
    { $match: { _id: { $in: collegeExists.classes } } },
    { $unwind: "$students" },
    { $group: { _id: null, studentIds: { $push: "$students" } } },
  ]);

  const studentIdsArray = allStudentIdsInCollege[0]?.studentIds || [];

  const { students } = req.body;

  // validate students array
  if (!students) {
    throw new ApiError(400, "Students array is required");
  }

  if (!Array.isArray(students)) {
    throw new ApiError(400, "Students must be an array");
  }

  if (!students.length) {
    throw new ApiError(400, "Students array cannot be empty");
  }

  // validate each student object
  for (let i = 0; i < students.length; ++i) {
    const student = students[i];

    validateStringField(student.name, "Name", i);
    validateStringField(student.department, "Department", i);
    validateStringField(student.email, "Email", i);
    validateStringField(student.prn, "PRN", i);
  }

  // fail-fast check for duplicate PRNs in college (optimized - stops at first match)
  const existingPRN = await Student.findOne({
    _id: { $in: studentIdsArray },
    prn: { $in: students.map((s) => s.prn) },
  }).select("prn");

  if (existingPRN) {
    throw new ApiError(
      409,
      `Student with PRN ${existingPRN.prn} already exists in college`
    );
  }

  // create students
  const createdStudents = await Student.insertMany(
    students.map((student) => ({
      ...student,
      classId,
    }))
  );

  // update class with new student IDs
  const studentIds = createdStudents.map((s) => s._id);
  await Class.findByIdAndUpdate(
    classId,
    { $push: { students: { $each: studentIds } } },
    { new: true }
  );

  res
    .status(201)
    .json(new ApiResponse(201, createdStudents, "Students added successfully"));
});
