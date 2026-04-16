import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
import redisClient from "./redis/redisClient.js";

// Only load .env in development
if (process.env.NODE_ENV !== "production") {
  dotenv.config({
    path: "./.env",
  });
}

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    
    console.log("Initializing Redis...");
    try {
        await redisClient.connect();
    } catch (redisErr) {
        console.error("Redis connection failed but continuing server startup:", redisErr.message);
    }

    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on port ${PORT}`);
    });

    app.on("error", (err) => {
      console.error("Server initialization error:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Critical failure during startServer:", err.message);
    process.exit(1);
  }
};

startServer();
