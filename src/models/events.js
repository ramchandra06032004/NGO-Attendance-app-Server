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
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
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
    currAttendanceString: {
      type: String,
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
  },
  { timestamps: true }
);
eventSchema.index({ coordinates: '2dsphere' });
export const Event = mongoose.model("Event", eventSchema);
