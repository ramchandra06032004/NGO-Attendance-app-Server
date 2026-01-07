import mongoose, { Schema } from "mongoose";
import hashPasswordHook from "../utils/loginUtils/hashPassword.js";
import { hashPasswordOnUpdate } from "../utils/loginUtils/hashOnUpdate.js";
import generateAccessToken from "../utils/loginUtils/accessTokenGen.js";
import generateRefreshToken from "../utils/loginUtils/refreshTokenGen.js";
const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    attendedEvents: [
      {
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
          required: true,
        },
        attendanceMarkedAt: {
          type: Date,
          default: Date.now,
        },
        markedBy: {
          ngoId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ngo",
          },
        },
      },
    ],
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      default: "defaultPassword123", // Default password
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    prn: {
      type: String,
      required: true,
      trim: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
    }
  },
  { timestamps: true }
);

studentSchema.pre("save", hashPasswordHook);
studentSchema.pre("findOneAndUpdate", hashPasswordOnUpdate);
studentSchema.pre("updateOne", hashPasswordOnUpdate);
studentSchema.pre("updateMany", hashPasswordOnUpdate);
studentSchema.methods.comparePassword = async function (candidatePassword) {

  if (!candidatePassword) throw new Error("Password is missing, cannot compare!");
  try {
    const result = candidatePassword === this.password;
    return result;
  } catch (error) {
    console.log("Error while comparing password!", error.message);
    return false;
  }
}
studentSchema.methods.generateAccessToken = generateAccessToken;
studentSchema.methods.generateRefreshToken = generateRefreshToken;
export const Student = mongoose.model("Student", studentSchema);
