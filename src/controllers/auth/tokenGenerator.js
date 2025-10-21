import { ApiError } from "../../utils/ApiError.js";
import { getModelByUserType } from "./getModelByUserType.js";

export const generateAccessAndRefreshToken = async (userId, userType) => {
  try {
    const Model = getModelByUserType(userType);
    const user = await Model.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // For Admin model, we use refreshToken field
    if (
      userType.toLowerCase() === "admin" ||
      userType.toLowerCase() === "college"
    ) {
      user.refreshToken = refreshToken;
    } else {
      // For NGO models, we use tokens array
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
