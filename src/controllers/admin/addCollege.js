import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { College } from "../../models/college.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadCollegeLogo } from "../../utils/google-cloud-storage-CRUD/uploadCollegeLogo.js";
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

  const logoLocalPath = req.file?.path;
  if (!logoLocalPath) {
    throw new ApiError(400, "College Logo is required");
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

  // 4. Upload image to Cloud Storage
  const logoUrl = await uploadCollegeLogo(logoLocalPath);

  if (!logoUrl) {
    throw new ApiError(500, "Failed to upload college logo to cloud storage");
  }

  const newCollege = await College.create({ name, email, address, password, logoUrl });

  return res
    .status(201)
    .json(new ApiResponse(201, newCollege, "College added successfully"));
});
