import college from "./college";
import mongoose from mongoose;

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
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
