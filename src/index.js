import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";
import redisClient from "./redis/redisClient.js";

// Load environment variables
dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();

    app.listen(PORT, "0.0.0.0", async () => {
      console.log(`Server running on port ${PORT}`);
    });

    app.on("error", (err) => {
      throw err;
    });
  } catch (err) {
    process.exit(1);
  }
};

startServer();
