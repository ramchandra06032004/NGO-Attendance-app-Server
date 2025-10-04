import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { College } from "../../models/college.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const addCollege = asyncHandler(async (req, res) => {
  if (req.user.userType !== "admin") {
    throw new ApiError(403, "Only admin users can add colleges");
  }

  const { name, email, address, password } = req.body;

  if (
    [name, email, address, password].some(
      (field) => !field || typeof field !== "string" || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingCollege = await College.findOne({
    $or: [{ email }, { name }],
  }).select("email name");

  if (existingCollege) {
    const duplicateField = existingCollege.email === email ? "email" : "name";
    throw new ApiError(
      409,
      `College with this ${duplicateField} already exists`
    );
  }

  const newCollege = await College.create({ name, email, address, password });

  return res
    .status(201)
    .json(new ApiResponse(201, newCollege, "College added successfully"));
});
