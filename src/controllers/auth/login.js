import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

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

export default login;