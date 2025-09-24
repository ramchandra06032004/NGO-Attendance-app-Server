const mongoose = require("mongoose");

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
          }
        },
      },
    ],
    prn: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
