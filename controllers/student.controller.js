const assignmentsModel = require("../models/assignments.model");
const StudentModel = require("../models/user.model");
const ResultModel = require("../models/Result");
const mongoose = require('mongoose');


const submitAssignment = async (req, res) => {
    try {
        const { assignmentId, studentId, studentName, score } = req.body;

        if (!assignmentId || !studentId || !studentName || score === undefined) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Fetch the assignment
        const assignment = await assignmentsModel.findById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found." });
        }

        // Check if submissions array exists
        if (!Array.isArray(assignment.submissions)) {
            assignment.submissions = [];
        }

        // Check if the student has already submitted
        const existingSubmission = assignment.submissions.find(sub => sub.studentId === studentId);
        if (existingSubmission) {
            return res.status(400).json({ message: "You have already submitted this assignment." });
        }

        // Add new submission
        assignment.submissions.push({ studentId, studentName, score });

        // Save changes
        await assignment.save();

        return res.status(200).json({
            message: "Assignment submitted successfully!",
            submission: { studentId, studentName, score },
        });
    } catch (error) {
        console.error("Error in submitAssignment:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getOneResult = async (req, res) => {
    const { studentId } = req.params;
  
    // ✅ 1. Check if studentId exists
    if (!studentId) {
      return res.status(400).json({ message: "Missing studentId in request params" });
    }
  
    // ✅ 2. Check if studentId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId format" });
    }
  
    try {
      // ✅ 3. Proceed to fetch student and result
      const student = await StudentModel.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      const result = await ResultModel.findOne({ studentId });
      if (!result) return res.status(404).json({ message: "No results found" });
  
      return res.json({
        studentId,
        name: student.name,
        results: result.results,
      });
    } catch (err) {
      console.error("Error in getOneResult:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
  

module.exports = {submitAssignment, getOneResult};
