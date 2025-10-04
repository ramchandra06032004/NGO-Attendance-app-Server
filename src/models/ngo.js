import mongoose from "mongoose";
import hashPasswordHook from "../utils/loginUtils/hashPassword.js";
import comparePassword from "../utils/loginUtils/comparePassword.js";
import generateAccessToken from "../utils/loginUtils/accessTokenGen.js";
import generateRefreshToken from "../utils/loginUtils/refreshTokenGen.js";
import { hashPasswordOnUpdate } from "../utils/loginUtils/hashOnUpdate.js";

const ngoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
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
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    eventsId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    role: {
      type: String,
      default: "ngo",
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: "10d", // auto-expire after 10 days
        },
      },
    ],
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true, // allows multiple documents with null values
      trim: true,
    },
  },
  { timestamps: true }
);

// Add password hashing middleware
ngoSchema.pre("save", hashPasswordHook);

ngoSchema.pre("findOneAndUpdate", hashPasswordOnUpdate);
ngoSchema.pre("updateOne", hashPasswordOnUpdate);
ngoSchema.pre("updateMany", hashPasswordOnUpdate);

// Add methods
ngoSchema.methods.comparePassword = comparePassword;
ngoSchema.methods.generateAccessToken = generateAccessToken;
ngoSchema.methods.generateRefreshToken = generateRefreshToken;

export const Ngo = mongoose.model("Ngo", ngoSchema);
