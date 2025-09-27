import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/admin.js";
import { Ngo } from "../models/ngo.js";
import { College } from "../models/college.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// const generateAccessAndRefreshToken = async (userId) => {
//   try {
//     const user = await Admin.findById(userId);
//     if (!user) {
//       throw new ApiError(404, "User not found");
//     }
//     const accessToken = user.generateAccessToken();
//     const refreshToken = user.generateRefreshToken();
//     user.refreshToken = refreshToken;
//     // Saving the refreshToken to the user document.
//     // Since only refreshToken is being updated, you can use validateBeforeSave: false for performance,
//     // unless you want to ensure all validations run. It's generally safe here.
//     await user.save({ validateBeforeSave: false });

//     return { accessToken, refreshToken };
//   } catch (error) {
//     throw new ApiError(500, "Error generating tokens");
//   }
// };

// const refreshAccessToken = asyncHandler(async (req, res) => {
//   const incomingRefreshToken =
//     req.cookies.refreshToken || req.body.refreshToken;

//   if (!incomingRefreshToken) {
//     throw new ApiError(401, "Refresh token is required");
//   }

//   try {
//     const decodedToken = jwt.verify(
//       incomingRefreshToken,
//       process.env.REFRESH_TOKEN_SECRET
//     );
//     const user = await Admin.findById(decodedToken?._id);

//     if (!user) {
//       throw new ApiError(404, "Invalid refresh token");
//     }

//     if (incomingRefreshToken !== user?.refreshToken) {
//       throw new ApiError(401, "Invalid refresh token");
//     }

//     const options = {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
//     };

//     const { accessToken, refreshToken: newRefereshToken } =
//       await generateAccessAndRefreshToken(user._id);

//     return res
//       .status(200)
//       .cookie("accessToken", accessToken, options)
//       .cookie("refreshToken", newRefereshToken, options)
//       .json(
//         new ApiResponse(
//           200,
//           { accessToken, refreshToken: newRefereshToken },
//           "Access token refreshed successfully"
//         )
//       );
//   } catch (error) {
//     throw new ApiError(
//       401,
//       "Something went wrong while refreshing access token"
//     );
//   }
// });

const registerAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if ([username, email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await Admin.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  try {
    const newUser = await Admin.create({ username, email, password });
    return res
      .status(201)
      .json(new ApiResponse(201, newUser, "Admin registered successfully"));
  } catch (error) {
    console.error("Error registering admin:", error);
    throw new ApiError(500, "Internal Server Error");
  }
});

const addCollege = asyncHandler(async (req, res) => {
  if(req.user.userType !== "admin") {
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

  try {
    const newCollege = await College.create({ name, email, address, password });
    return res
      .status(201)
      .json(new ApiResponse(201, newCollege, "College added successfully"));
  } catch (error) {
    console.error("Error adding college:", error);
    throw new ApiError(500, "Internal Server Error");
  }

})

const addNgo = asyncHandler(async (req, res) => {
  if(req.user.userType !== "admin") {
    throw new ApiError(403, "Only admin users can add NGOs");
  }
  
  const { name, email, address, password, mobile, registrationNumber } =
    req.body;

  if ([name, email, address, password, mobile, registrationNumber].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existingNgo = await Ngo.findOne({ email });
  if (existingNgo) {
    throw new ApiError(409, "NGO with this email already exists");
  }

  try {
    const newNgo = await Ngo.create({ name, email, address, password, mobile, registrationNumber });
    return res
      .status(201)
      .json(new ApiResponse(201, newNgo, "NGO added successfully"));
  } catch (error) {
    console.error("Error adding NGO:", error);
    throw new ApiError(500, "Internal Server Error");
  }

})

export {
  registerAdmin,
  addCollege,
  addNgo,
};
