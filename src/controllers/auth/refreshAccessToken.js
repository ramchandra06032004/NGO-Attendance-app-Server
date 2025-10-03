import jwt from "jsonwebtoken";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getModelByUserType } from "./getModelByUserType.js";
import { generateAccessAndRefreshToken } from "./tokenGenerator.js";


export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const userType = decodedToken.role; // Get user type from token

    const Model = getModelByUserType(userType);

    const user = await Model.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    // Validate refresh token based on user type
    let isValidToken = false;
    if (
      userType.toLowerCase() === "admin" ||
      userType.toLowerCase() === "college"
    ) {
      isValidToken = incomingRefreshToken === user.refreshToken;
    } else {
      // For NGO, check in tokens array
      isValidToken = user.tokens.some(
        (tokenObj) => tokenObj.token === incomingRefreshToken
      );
    }

    if (!isValidToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id, userType);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      "Something went wrong while refreshing access token"
    );
  }
});

