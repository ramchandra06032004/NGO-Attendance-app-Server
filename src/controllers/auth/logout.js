import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getModelByUserType } from "./getModelByUserType.js";
// Generic Logout Function
export const logout = asyncHandler(async (req, res) => {
  const { userType } = req.user; // This will come from the JWT token

  const Model = getModelByUserType(userType);

  if (
    userType.toLowerCase() === "admin" ||
    userType.toLowerCase() === "college"
  ) {
    // For Admin model, clear refreshToken field
    await Model.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      { new: true }
    );
  } else {
    // For NGO models, clear tokens array
    //changes can be done in logout as
    //if the multiple devices are logged in then we can remove only that device token
    //not all tokens
    await Model.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          tokens: [],
        },
      },
      { new: true }
    );
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, `${userType} logged out successfully`));
});


