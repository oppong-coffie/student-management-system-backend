const express = require("express");
const router = express.Router();
const { postAssignments, postStudents,   postNotification,
    getNotifications,
    updateNotification, saveResults,
    deleteNotification, getResults, getTimetable, saveTimetable, deleteStudent, updateStudent, getStudentById, getAllStudents, deleteLiveClass, getAssignments, editAssignments, addLiveClass, getLiveClass, deleteAssignment, uploadResources, getAllMaterials, updateMaterial, deleteMaterial,  getAllSubjects, createSubject,
    checkInStudent,
    checkOutStudent,
    getAttendanceByDate, } = require("../controllers/teacher.controller.js");

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

router.post('/notifications', postNotification);
router.get('/notifications', getNotifications);
router.put('/notifications/:id', updateNotification);
router.delete('/notifications/:id', deleteNotification);



router.get("/results", getResults);
router.post("/save-results", saveResults);

router.post("/attendance/check-in", checkInStudent)
router.post("/attendance/check-out", checkOutStudent)
router.get('/attendance', getAttendanceByDate)

module.exports = router; // Export router
