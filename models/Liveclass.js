const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  link: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('liveclass', liveClassSchema);
