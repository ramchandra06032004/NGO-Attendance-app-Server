import mongoose from "mongoose";
import bcrypt from "bcrypt";
import hashPasswordHook from "../utils/hashPassword";
import comparePassword from "../utils/comparePassword";
import isThisEmailInUse from "../utils/isEmailInUse";

const userSchema = new mongoose.Schema({
  fullname: {
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
  tokens: [{ type: Object }],
});

userSchema.pre("save", hashPasswordHook)
userSchema.methods.comparePassword = comparePassword
userSchema.methods.isThisEmailInUse = isThisEmailInUse

module.exports = mongoose.model("User", userSchema);
