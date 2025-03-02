const assignmentsModel = require("../models/assignments.model");


// START:: fetch assignments
const getAssignments = async (req, res) => {
    try {
        const response = await assignmentsModel.find();
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Error fetching assignments", error });
    }
};
// END:: fetch assignments

// START:: Post new assignments
const postAssignments = async (req, res) => {
    const { title, dueDate, submissions, questions } = req.body; // Extract only valid fields

    try {
        const response = await assignmentsModel.create({
            title, 
            dueDate, 
            submissions, 
            questions // Ensure this is an array of objects
        });

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: "Error posting assignment", error });
    }
};
// END:: Post new assignments

// START:: Update assignment
const editAssignments = async (req, res) => {
    const { id } = req.params; // Get assignment ID from URL params
    const { title, dueDate, submissions, questions } = req.body;

    try {
        const updatedAssignment = await assignmentsModel.findByIdAndUpdate(
            id, 
            { title, dueDate, submissions, questions }, // Updated fields
            { new: true } // Return the updated document
        );

        if (!updatedAssignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.json({ message: "Assignment updated successfully", data: updatedAssignment });
    } catch (error) {
        res.status(500).json({ message: "Error updating assignment", error });
    }
};
// END:: Update assignment

const deleteAssignment = async (req, res) => {
    const { id } = req.params; // Get the assignment ID from URL

    try {
        const deletedAssignment = await assignmentsModel.findByIdAndDelete(id);

        if (!deletedAssignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.json({ message: "Assignment deleted successfully", data: deletedAssignment });
    } catch (error) {
        res.status(500).json({ message: "Error deleting assignment", error });
    }
};





// Export all functions properly
module.exports = { postAssignments, getAssignments, editAssignments, deleteAssignment };
