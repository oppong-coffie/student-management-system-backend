// models/Timetable.js
const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  timetable: {
    type: Map,
    of: [String], // Array of subjects per day key
    required: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
