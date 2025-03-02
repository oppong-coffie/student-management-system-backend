const assignmentsModel = require("../models/assignments.model");

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

module.exports = submitAssignment;
