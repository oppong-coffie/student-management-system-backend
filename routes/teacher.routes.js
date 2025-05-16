const express = require("express");
const router = express.Router();
const { postAssignments, postStudents, getTimetable, saveTimetable, deleteStudent, updateStudent, getStudentById, getAllStudents, deleteLiveClass, getAssignments, editAssignments, addLiveClass, getLiveClass, deleteAssignment, uploadResources, getAllMaterials, updateMaterial, deleteMaterial,  getAllSubjects, createSubject, } = require("../controllers/teacher.controller.js");

// Define route
router.post("/postassignments", postAssignments);
router.put("/editassignments/:id", editAssignments);
router.delete("/deleteassignments/:id", deleteAssignment);
router.get("/getassignments", getAssignments);

router.post("/upload-resource", uploadResources)
router.get('/study-materials', getAllMaterials);
router.put('/study-materials/:id', updateMaterial);
router.delete('/study-materials/:id', deleteMaterial);

router.post('/live-classes', addLiveClass);
router.get('/live-classes', getLiveClass);
router.delete('/live-classes/:id', deleteLiveClass);

router.post('/students', postStudents);
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);


router.get('/subjects', getAllSubjects);
router.post('/subjects', createSubject);

router.get('/timetable', getTimetable);
router.post('/timetable', saveTimetable);

module.exports = router; // Export router
