const mongoose = require("mongoose");

const studentAttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  date: {
    type: String, // e.g., '2025-05-18'
    required: true,
  },
  checkInTime: String,
  checkOutTime: String,
});

module.exports = mongoose.model("attendances", studentAttendanceSchema);
