import mongoose from "mongoose";
import hashPasswordHook from "../utils/hashPassword.js";
import comparePassword from "../utils/comparePassword.js";
// import isThisEmailInUse from "../utils/isEmailInUse.js";
import jwt from "jsonwebtoken";
import generateAccessToken from "../utils/accessTokenGen.js";
import generateRefreshToken from "../utils/refreshTokenGen.js";

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: String,
  refreshToken: {
    type: String,
  },
  role: {
    type: String,
    default: "admin"
  }
});

adminSchema.pre("save", hashPasswordHook);
adminSchema.methods.comparePassword = comparePassword;
// adminSchema.methods.isThisEmailInUse = isThisEmailInUse;

adminSchema.methods.generateAccessToken = generateAccessToken;
adminSchema.methods.generateRefreshToken = generateRefreshToken;
export const Admin = mongoose.model("Admin", adminSchema);
