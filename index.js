require("dotenv").config(); // Load environment variables
const session = require("express-session");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const teacherRoutes = require("./routes/teacher.routes.js");
const studentRoutes = require("./routes/student.routes.js");
const authRoutes = require("./routes/auth.routes");


const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// ✅ Configure session
app.use(
  session({
      secret: "123456", // Use an environment variable in production
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false, httpOnly: true }, // Set `secure: true` in production (HTTPS)
  })
);

// Use teacher routes
app.use("/teachers", teacherRoutes);

// Use students routes
app.use("/students", studentRoutes);

// Use authentication routes
app.use("/auth", authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});