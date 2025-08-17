const mongoose = require("mongoose");

// Question Schema
const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    correctAnswer: { type: String, required: true }
});

// Submission Schema
const SubmissionSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    score: { type: Number, required: true },
});

// Assignment Schema
const AssignmentSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        dueDate: { type: Date, required: true }, // Changed from String to Date
        submissions: { type: [SubmissionSchema], default: [] }, // Store students' scores
        questions: { type: [QuestionSchema], required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("theory", AssignmentSchema);
