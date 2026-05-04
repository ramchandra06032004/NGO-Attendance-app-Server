import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
      trim: true,
    },
    aim: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String, // Store image URLs or file paths
        trim: true,
      },
    ],
    eventDate: {
      type: Date,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "HH:mm" or "HH:mm AM/PM"
      required: true,
    },
    endTime: {
      type: String, // Format: "HH:mm" or "HH:mm AM/PM"
      required: true,
    },
    spocName: {
      type: String,
      required: true,
      trim: true,
    },
    spocContact: {
      type: String,
      required: true,
      trim: true,
    },
    colleges: [
      {
        collegeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "College",
          required: true,
        },
        students: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
          }
        ]
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ngo",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
