const Notification = require('../models/Notification');
const Attendance = require('../models/AttendanceModel');

const getNotification = async (req, res) => {
  try {
    const notices = await Notification.find().sort({ date: -1 });
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const postNotification = async (req, res) => {
    try {
      const newNotice = new Notification({
        title: req.body.title,
        message: req.body.message,
      });
  
      const saved = await newNotice.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create notification" });
    }
  };

  
//START:: GET /parents/attendance/:studentId?date=YYYY-MM-DD
const getAttendance = async (req, res) => {
  const { studentId } = req.params;
  const { date } = req.query;

  if (!studentId) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  const filter = { studentId };
  if (date) {
    // Optionally validate date format: YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
    }
    filter.date = date;
  }

  try {
    const records = await Attendance.find(filter).sort({ date: -1 });
    if (!records || records.length === 0) {
      return res.status(404).json({ message: "No attendance records found" });
    }
    res.json(records);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
};


module.exports = {postNotification, getNotification, getAttendance};
