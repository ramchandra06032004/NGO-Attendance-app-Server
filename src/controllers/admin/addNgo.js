import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Ngo } from "../../models/ngo.js";
import ApiResponse from "../../utils/ApiResponse.js";

const addNgo = asyncHandler(async (req, res) => {
  try {
    if (req.user.userType !== "admin") {
      throw new ApiError(403, "Only admin users can add NGOs");
    }

    const { name, email, address, password, mobile, registrationNumber } =
      req.body;

    if (
      [name, email, address, password, mobile, registrationNumber].some(
        (field) => field.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const existingNgo = await Ngo.findOne({ email });
    if (existingNgo) {
      throw new ApiError(409, "NGO with this email already exists");
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
  } catch (error) {
    console.error("Error adding NGO:", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

export default addNgo;
