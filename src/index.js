//Check it once that is it proper

import dotenv from "dotenv";
import { app } from "./app.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error: ", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });
  } catch (error) {
    console.error("MongoDB initial connection error: ", error);
    process.exit(1);
  }
};

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 NGO Attendance Server is running on port ${PORT}`);
      console.log(`📱 Server configured for React Native app`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
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
