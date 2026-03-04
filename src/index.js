//Check it once that is it proper

import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
import redisClient from "./redis/redisClient.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log("🚀 Starting NGO Attendance Server...");

    // Connect to database first
    await connectDB();
    await redisClient.connect();


    // Start the server after successful database connection
    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`🚀 NGO Attendance Server is running on port ${PORT}`);
      console.log(`📱 Server configured for React Native app`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("✅ Server started successfully!");
      console.log("🔑 Redis connection established successfully!");
    });

    app.on("error", (err) => {
      console.log("Server Error: ", err);
      throw err;
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

// Call the function at the end
startServer();

// Handle process termination gracefully
// process.on("SIGINT", () => {
//   console.log("\n🛑 Server shutting down gracefully...");
//   process.exit(0);
// });

// process.on("SIGTERM", () => {
//   console.log("\n🛑 Server shutting down gracefully...");
//   process.exit(0);
// });
