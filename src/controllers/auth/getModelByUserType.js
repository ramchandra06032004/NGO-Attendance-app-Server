import { Admin } from "../../models/admin.js";
import { College } from "../../models/college.js";
import { Ngo } from "../../models/ngo.js";
import { Student } from "../../models/student.js";
import { Branch } from "../../models/branch.js";
import { ApiError } from "../../utils/ApiError.js";

export const getModelByUserType = (userType) => {
  switch (userType.toLowerCase()) {
    case "admin":
      return Admin;
    case "college":
      return College;
    case "ngo":
      return Ngo;
    case "branch_admin":
      return Branch;
    case "student":
      return Student;
    default:
      throw new ApiError(400, "Invalid user type");
  }
};
