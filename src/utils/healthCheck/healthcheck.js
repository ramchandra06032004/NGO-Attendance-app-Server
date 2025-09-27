const healthCheck=(req, res) => {
  res.status(200).json({
    success: true,
    message: "NGO Attendance Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
}


export default healthCheck