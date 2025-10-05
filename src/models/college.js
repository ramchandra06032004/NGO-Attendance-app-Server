import mongoose from "mongoose";
import hashPasswordHook from "../utils/loginUtils/hashPassword.js";
import comparePassword from "../utils/loginUtils/comparePassword.js";
import generateAccessToken from "../utils/loginUtils/accessTokenGen.js";
import generateRefreshToken from "../utils/loginUtils/refreshTokenGen.js";
import { hashPasswordOnUpdate } from "../utils/loginUtils/hashOnUpdate.js";

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class", // Reference to Class model
      },
    ],
    role: {
      type: String,
      default: "college",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Add password hashing middleware for save operations
collegeSchema.pre("save", hashPasswordHook);

// Apply password hashing middleware to all update operations
collegeSchema.pre("findOneAndUpdate", hashPasswordOnUpdate);
collegeSchema.pre("updateOne", hashPasswordOnUpdate);
collegeSchema.pre("updateMany", hashPasswordOnUpdate);

// Add methods
collegeSchema.methods.comparePassword = comparePassword;
collegeSchema.methods.generateAccessToken = generateAccessToken;
collegeSchema.methods.generateRefreshToken = generateRefreshToken;

export const College = mongoose.model("College", collegeSchema);
