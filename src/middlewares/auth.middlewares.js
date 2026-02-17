import jwt from "jsonwebtoken";
import { Admin } from "../models/admin.js";
import { College } from "../models/college.js";
import { Ngo } from "../models/ngo.js";
import { Student } from "../models/student.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getModelByUserType = (userType) => {
  switch (userType?.toLowerCase()) {
    case "admin":
      return Admin;
    case "college":
      return College;
    case "ngo":
      return Ngo;
    case "student":
      return Student;
    default:
      throw new ApiError(400, "Invalid user type");
  }
};

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    let token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    if (!token) {
      throw new ApiError(401, "You are not authorized to access this resource");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Get user type from token (role field)
    const userType = decodedToken.role;
    if (!userType) {
      throw new ApiError(401, "Invalid token: missing role information");
    }

    const Model = getModelByUserType(userType);
    const user = await Model.findById(decodedToken?._id).select(
      "-password -refreshToken -tokens"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized Access");
    }

    console.log(`Done with ${userType} user verification`);
    req.user = user;
    req.user.userType = userType; // Add userType to req.user for logout function
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "You are not authorized to access this resource"
    );
  }
});
