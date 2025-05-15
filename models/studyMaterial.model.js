// models/StudyMaterial.js

const mongoose = require('mongoose');

const StudyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: String,
  fileType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('resources', StudyMaterialSchema);
