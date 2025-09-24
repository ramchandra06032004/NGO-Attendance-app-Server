//Check it once that is it proper

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    // Start the Express server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 NGO Attendance Server is running on port ${PORT}`);
      console.log(`📱 Server configured for React Native app`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle server errors
    app.on("error", (err) => {
      console.log("Server Error: ", err);
      throw err;
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed !!! ", err);
    process.exit(1);
  });

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n🛑 Server shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Server shutting down gracefully...");
  process.exit(0);
});
