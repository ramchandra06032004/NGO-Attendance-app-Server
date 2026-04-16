import { College } from "../../models/college.js";
import { Class } from "../../models/class.js";
import { Student } from "../../models/student.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

const validateStringField = (field, fieldName, index) => {
  if (!field || typeof field !== "string" || !field.trim()) {
    throw new ApiError(
      400,
      `Volunteer at index ${index}: ${fieldName} must be a non-empty string`
    );
  }
};

export const addVolunteers = asyncHandler(async (req, res) => {
  if (req.user.userType !== "ngo") {
    throw new ApiError(403, "Access denied: Only NGOs can add volunteers");
  }

  const ngoUser = req.user;
  const { students } = req.body; // Actually volunteers

  if (!students || !Array.isArray(students) || !students.length) {
    throw new ApiError(400, "Volunteers array is required and cannot be empty");
  }

  // Validate each volunteer object
  for (let i = 0; i < students.length; ++i) {
    const student = students[i];
    validateStringField(student.name, "Name", i);
    validateStringField(student.department, "Department", i);
    validateStringField(student.email, "Email", i);
    validateStringField(student.prn, "PRN", i);
  }

  // Check email uniqueness across entire DB
  const existingEmail = await Student.findOne({
    email: { $in: students.map((s) => s.email) },
  }).select("email");

  if (existingEmail) {
    throw new ApiError(409, `User with email ${existingEmail.email} already exists in database`);
  }

  // 1. Find or Create Dummy College for NGO
  const dummyCollegeName = `${ngoUser.name} Volunteers`;
  let dummyCollege = await College.findOne({ 
    name: { $regex: new RegExp(`^${dummyCollegeName}$`, 'i') } 
  });

  if (!dummyCollege) {
    const randomPassword = crypto.randomBytes(8).toString("hex");
    dummyCollege = await College.create({
      name: dummyCollegeName,
      email: `volunteers_${crypto.randomBytes(4).toString("hex")}@${ngoUser.email.replace('@', '_at_')}`, // Unique dummy email
      address: ngoUser.address || "NGO Address",
      logoUrl: ngoUser.logoUrl || "https://placeholderlogo.com/logo.png",
      password: randomPassword,
      classes: [],
      role: "college",
      isDummyCollege: true
    });
  }

  // 2. Find or Create Dummy Class in that College
  const dummyClassName = "2024-2025VOL"; // Must match Regex /^\d{4}-\d{4}.{1,6}$/
  let dummyClassId = null;

  await dummyCollege.populate("classes");
  const existingClass = dummyCollege.classes.find(c => c.className === dummyClassName);

  if (existingClass) {
    dummyClassId = existingClass._id;
  } else {
    const newClass = await Class.create({
      className: dummyClassName,
      students: []
    });
    dummyClassId = newClass._id;
    dummyCollege.classes.push(newClass._id);
    await dummyCollege.save();
  }

  // 3. Process and insert volunteers
  // Check for duplicate PRNs in this specific college
  const allStudentIdsInCollege = await Class.aggregate([
    { $match: { _id: { $in: dummyCollege.classes.map(c => c._id || c) } } },
    { $unwind: "$students" },
    { $group: { _id: null, studentIds: { $push: "$students" } } },
  ]);
  
  const studentIdsArray = allStudentIdsInCollege[0]?.studentIds || [];
  
  if (studentIdsArray.length > 0) {
      const existingPRN = await Student.findOne({
        _id: { $in: studentIdsArray },
        prn: { $in: students.map((s) => s.prn) },
      }).select("prn");

      if (existingPRN) {
        throw new ApiError(409, `Volunteer with ID/PRN ${existingPRN.prn} already exists in your NGO volunteers list.`);
      }
  }

  // Hash passwords and insert
  const studentsWithHashedPasswords = await Promise.all(
    students.map(async (student) => {
      const password = student.password || "defaultPassword123";
      const hashedPassword = await bcrypt.hash(password, 10);
      return {
        ...student,
        password: hashedPassword,
        classId: dummyClassId,
      };
    })
  );

  const createdStudents = await Student.insertMany(studentsWithHashedPasswords);

  // Update class with new student IDs
  const newStudentIds = createdStudents.map((s) => s._id);
  await Class.findByIdAndUpdate(dummyClassId, {
    $push: { students: { $each: newStudentIds } },
  });

  res.status(201).json(new ApiResponse(201, createdStudents, "Volunteers added successfully"));
});
