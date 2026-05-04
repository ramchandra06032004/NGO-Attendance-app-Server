import mongoose from "mongoose";
import hashPasswordHook from "../utils/loginUtils/hashPassword.js";
import comparePassword from "../utils/loginUtils/comparePassword.js";
import generateAccessToken from "../utils/loginUtils/accessTokenGen.js";
import generateRefreshToken from "../utils/loginUtils/refreshTokenGen.js";
import { hashPasswordOnUpdate } from "../utils/loginUtils/hashOnUpdate.js";

const branchSchema = new mongoose.Schema(
  {
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ngo",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    adminName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    adminPhone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "branch_admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokens: [
      {
        refreshToken: {
          type: String,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: "10d",
        },
      },
    ],
  },
  { timestamps: true }
);

// Add password hashing middleware
branchSchema.pre("save", hashPasswordHook);

branchSchema.pre("findOneAndUpdate", hashPasswordOnUpdate);
branchSchema.pre("updateOne", hashPasswordOnUpdate);
branchSchema.pre("updateMany", hashPasswordOnUpdate);

// Add methods
branchSchema.methods.comparePassword = comparePassword;
branchSchema.methods.generateAccessToken = generateAccessToken;
branchSchema.methods.generateRefreshToken = generateRefreshToken;

export const Branch = mongoose.model("Branch", branchSchema);
