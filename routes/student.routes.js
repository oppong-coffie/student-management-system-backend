const express = require("express");
const { submitAssignment, getOneResult } = require("../controllers/student.controller");
const router = express.Router();

// Define routes
router.post("/submit", submitAssignment);

// 👇 This now matches: GET /students/:studentId
router.get("/:studentId", getOneResult);

module.exports = router;
