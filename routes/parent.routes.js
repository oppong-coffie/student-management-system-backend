const express = require('express');
const router = express.Router();
const {postNotification, getAttendance, getNotification} = require('../controllers/parent.controller');
const { getAttendanceByDate } = require('../controllers/teacher.controller');

router.get('/notification', getNotification);
router.post('/notification', postNotification);
router.get('/attendance/:studentId', getAttendance)

module.exports = router;
