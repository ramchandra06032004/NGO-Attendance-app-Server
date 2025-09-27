const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: "NGO Attendance Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      auth: "/api/v1/auth",
      admin: "/api/v1/admin",
      college: "/api/v1/college",
      ngo: "/api/v1/ngo",
    },
  });
};


export default healthCheck