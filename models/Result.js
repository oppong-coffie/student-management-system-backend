// models/Result.js
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  class_score: { type: Number, default: null },
  exam_score: { type: Number, default: null }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  results: {
    Math: subjectSchema,
    English: subjectSchema,
    Science: subjectSchema,
  }
});

module.exports = mongoose.model('results', resultSchema);
