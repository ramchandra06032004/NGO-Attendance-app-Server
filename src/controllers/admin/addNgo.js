import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Ngo } from "../../models/ngo.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const addNgo = asyncHandler(async (req, res) => {
  if (req.user.userType !== "admin") {
    throw new ApiError(403, "Only admin users can add NGOs");
  }

  const { name, email, address, password, mobile, registrationNumber } =
    req.body;

  if (
    [name, email, address, password, mobile, registrationNumber].some(
      (field) => !field || typeof field !== "string" || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingNgo = await Ngo.findOne({
    $or: [{ email }, { name }],
  }).select("email name");

  if (existingNgo) {
    const duplicateField = existingNgo.email === email ? "email" : "name";
    throw new ApiError(409, `NGO with this ${duplicateField} already exists`);
  }

  const newNgo = await Ngo.create({
    name,
    email,
    address,
    password,
    mobile,
    registrationNumber,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newNgo, "NGO added successfully"));
});
