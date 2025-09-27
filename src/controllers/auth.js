import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/admin.js";
import { College } from "../models/college.js";
import { Ngo } from "../models/ngo.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Model mapping system
const getModelByUserType = (userType) => {
  switch (userType.toLowerCase()) {
    case "admin":
      return Admin;
    case "college":
      return College;
    case "ngo":
      return Ngo;
    default:
      throw new ApiError(400, "Invalid user type");
  }
};

const generateAccessAndRefreshToken = async (userId, userType) => {
  try {
    const Model = getModelByUserType(userType);
    const user = await Model.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // For Admin model, we use refreshToken field
    if (userType.toLowerCase() === "admin" || userType.toLowerCase() === "college") {
      user.refreshToken = refreshToken;
    } else {
      // For College and NGO models, we use tokens array 
      //as at the same time multiple devices can be logged in
      user.tokens = user.tokens || [];
      user.tokens.push({
        token: refreshToken,
        createdAt: new Date(),
      });
    }

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

// Generic Login Function
const login = asyncHandler(async (req, res) => {
  const { email, password, userType } = req.body;

  // Validate input
  if (!email || !password || !userType) {
    throw new ApiError(400, "Email, password, and user type are required");
  }

  const Model = getModelByUserType(userType);

  // Find user by email
  const user = await Model.findOne({ email });
  if (!user) {
    throw new ApiError(404, `${userType} not found with this email`);
  }

  // Check password (assuming all models have comparePassword method)
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
    userType
  );

  // Set cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? undefined : "localhost",
  };


  const loggedInUser = await Model.findById(user._id).select(
    "-password -refreshToken -tokens"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          userType: user.role || userType,
        },
        `${userType} logged in successfully`
      )
    );
});

// Generic Logout Function
const logout = asyncHandler(async (req, res) => {
  const { userType } = req.user; // This will come from the JWT token

  const Model = getModelByUserType(userType);

  if (userType.toLowerCase() === "admin" || userType.toLowerCase() === "college") {
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

// Generic Refresh Token Function
const refreshAccessToken = asyncHandler(async (req, res) => {
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
    if (userType.toLowerCase() === "admin" || userType.toLowerCase() === "college") {
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

export { login, logout, refreshAccessToken, generateAccessAndRefreshToken };
