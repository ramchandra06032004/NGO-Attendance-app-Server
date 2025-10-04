import mongoose from "mongoose";

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
            ref: "NGO",
          },
        },
      },
    ],
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
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
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
