//Check it once that is it proper

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import healthCheck from "./utils/healthCheck/healthcheck";

const app = express();

// CORS configuration for React Native app
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // Allow all origins for React Native development
      // In production, you might want to restrict this to specific domains
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Middleware for parsing JSON requests
app.use(
  express.json({
    limit: "16kb", // Limit for file uploads
  })
);

// Middleware for parsing URL-encoded data
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

// Middleware for serving static files (images, documents, etc.)
app.use(express.static("public"));

// Cookie parser middleware
app.use(cookieParser());

// Request logging middleware for development
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health check route for React Native app
app.get("/api/health", healthCheck);

// API routes
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import collegeRoutes from "./routes/college.routes.js";
import ngoRoutes from "./routes/ngo.routes.js";

app.use("/api/v1/auth", authRoutes); // Universal auth routes (login, logout, register)
app.use("/api/v1/admin", adminRoutes); // Admin-specific routes
app.use("/api/v1/college", collegeRoutes); // College-specific routes
app.use("/api/v1/ngo", ngoRoutes); // NGO-specific routes

// Global error handling middleware for React Native API
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Handle 404 for API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  } else {
    next();
  }
});

// Catch all handler for non-API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "Route not found. This server is designed for React Native app API calls.",
  });
});

export default app;
