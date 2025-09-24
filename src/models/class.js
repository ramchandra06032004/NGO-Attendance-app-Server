import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (value) {
          // Regex pattern: YYYY-YYYY format followed by up to 6 characters
          // Examples: "2023-2024FE", "2024-2025SE", "2023-202411", "2023-2024BE"
          const classPattern = /^\d{4}-\d{4}.{1,6}$/;
          return classPattern.test(value);
        },
        message:
          "Class must be in format: [YYYY-YYYY][1-6 characters]. Example: 2023-2024FE, 2024-2025SE",
      },
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
