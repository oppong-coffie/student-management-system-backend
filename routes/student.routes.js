const express = require("express");
const { submitAssignment, getOneResult, submitExercice, submitTheoryAnswers } = require("../controllers/student.controller");
const router = express.Router();

// Define routes
router.post("/submit", submitAssignment);


router.post("/theorysubmit", submitTheoryAnswers);

router.get("/:studentId", getOneResult);

router.get("/submitexercise", submitExercice);


module.exports = router;
