import Class from "../models/class.js";
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

export const addStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  if (!classId) throw new ApiError(400, "Class ID is required");

  const classExists = await Class.findById(classId);
  if (!classExists) throw new ApiError(404, "Class not found");

  const { students } = req.body;

  // Validate students array
  if (!students) {
    throw new ApiError(400, "Students array is required");
  }

  if (!Array.isArray(students)) {
    throw new ApiError(400, "Students must be an array");
  }

  if (!students.length) {
    throw new ApiError(400, "Students array cannot be empty");
  }

  // Validate each student object
  for (let i = 0; i < students.length; ++i) {
    const student = students[i];

    validateStringField(student.name, "Name", i);
    validateStringField(student.department, "Department", i);
    validateStringField(student.email, "Email", i);
    validateStringField(student.prn, "PRN", i);

    const studentExists = await Student.findOne({
      $or: [{ email: student.email }, { prn: student.prn }],
    });
    if (studentExists) {
      throw new ApiError(
        409,
        `Student with PRN '${student.prn}' or email '${student.email}' already exists`
      );
    }
  }

  const createdStudents = await Student.insertMany(
    students.map((student) => ({
      ...student,
      classId,
    }))
  );

  const studentIds = createdStudents.map((s) => s._id);
  const updatedClass = await Class.findByIdAndUpdate(
    classId,
    { $push: { students: { $each: studentIds } } },
    { new: true }
  );

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { createdStudents, updatedClass },
        "Students added successfully"
      )
    );
});
