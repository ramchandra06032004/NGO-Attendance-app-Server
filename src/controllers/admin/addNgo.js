import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Ngo } from "../../models/ngo.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadNgoProfilePic } from "../../utils/google-cloud-storage-CRUD/uploadNGOProfilePic.js";

export const addNgo = asyncHandler(async (req, res) => {
  // // --- DEBUG LOGS START ---
  // console.log("👉 User Type:", req.user?.userType);
  // console.log("👉 Body Received:", req.body);
  // console.log("👉 File Received:", req.file);
  // // --- DEBUG LOGS END ---
  if (req.user.userType !== "admin") {
    throw new ApiError(403, "Only admin users can add NGOs");
  }


  const { name, email, address, password, mobile, registrationNumber } =
    req.body;

  // 1. Validate text fields
  if (
    [name, email, address, password, mobile, registrationNumber].some(
      (field) => !field || typeof field !== "string" || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All text fields are required");
  }

  // 2. Check for the logo file (Multer puts the file in req.file)
  const logoLocalPath = req.file?.path;

  if (!logoLocalPath) {
    throw new ApiError(400, "NGO Logo is required");
  }

  // 3. Check for duplicates
  const existingNgo = await Ngo.findOne({
    $or: [{ email }, { name }],
  }).select("email name");

  if (existingNgo) {
    const duplicateField = existingNgo.email === email ? "email" : "name";
    throw new ApiError(409, `NGO with this ${duplicateField} already exists`);
  }

  // 4. Upload image to Cloud Storage
  const logoUrl = await uploadNgoProfilePic(logoLocalPath);

  if (!logoUrl) {
    throw new ApiError(500, "Failed to upload logo to cloud storage");
  }

  // 5. Create NGO with the logo URL
  const newNgo = await Ngo.create({
    name,
    email,
    address,
    password,
    mobile,
    registrationNumber,
    profileImage: logoUrl,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newNgo, "NGO added successfully"));
});
