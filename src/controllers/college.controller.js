import Class from "../models/class.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addClass = asyncHandler(async (req, res) => {
  const { className } = req.body;
  if (!className || typeof className !== "string" || className.trim() === "") {
    throw new ApiError(400, "Class name must be a non-empty string");
  }

  const classExists = await Class.findOne({ className });
  if (classExists)
    throw new ApiError(400, "Class with this name already exists");

  const newClass = await Class.create({ className });
  return res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class created successfully"));
});
