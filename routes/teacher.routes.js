const express = require("express");
const router = express.Router();
const { postAssignments, getAssignments, editAssignments, deleteAssignment } = require("../controllers/teacher.controller.js"); // Import controller function

// Define route
router.post("/postassignments", postAssignments);
router.put("/editassignments/:id", editAssignments);
router.delete("/deleteassignments/:id", deleteAssignment);
router.get("/getassignments", getAssignments);

module.exports = router; // Export router
