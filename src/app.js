import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import healthCheck from "./utils/healthCheck/healthcheck.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import collegeRoutes from "./routes/college.routes.js";
import ngoRoutes from "./routes/ngo.routes.js";

const app = express();

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(
  express.json({
    limit: "16kb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/api/health", healthCheck);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/college", collegeRoutes);
app.use("/api/v1/ngo", ngoRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  });
});

app.use((req, res, next) => {
  console.log("Request Path:", req.path);

  if (req.path.startsWith("/api/")) {
    res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  } else {
    next();
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "Route not found. This server is designed for React Native app API calls.",
  });
});

export default app;
