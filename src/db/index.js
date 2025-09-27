import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error: ", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });

    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("MongoDB initial connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
