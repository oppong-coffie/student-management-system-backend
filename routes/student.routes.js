const express = require("express");
const submitAssignment = require("../controllers/student.controller");
const router = express.Router();

// Define route
router.post("/submit", submitAssignment);


module.exports = router; // Export router