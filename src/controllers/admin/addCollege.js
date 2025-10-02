import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { College } from "../../models/college.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const addCollege = asyncHandler(async (req, res) => {
  try {
    if (req.user.userType !== "admin") {
      throw new ApiError(403, "Only admin users can add colleges");
    }

    const { name, email, address, password } = req.body;

    if ([name, email, address, password].some((field) => field.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    const existingCollege = await College.findOne({ email });
    if (existingCollege) {
      throw new ApiError(409, "College with this email already exists");
    }

    const newCollege = await College.create({ name, email, address, password });
    return res
      .status(201)
      .json(new ApiResponse(201, newCollege, "College added successfully"));
  } catch (error) {
    console.error("Error adding college:", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

export default addCollege;
