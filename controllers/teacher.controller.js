const assignmentsModel = require("../models/assignments.model");
const StudyMaterial = require("../models/studyMaterial.model")
const LiveClass = require('../models/Liveclass'); // adjust path to your model
const Student = require('../models/user.model')
const Result = require("../models/Result");
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const Timetable = require('../models/Timetable');
const User = require('../models/user.model');
const path = require('path');
const multer = require('multer');
const Attendance = require('../models/AttendanceModel');
const moment = require('moment'); // Optional for date formatting
const axios = require("axios");

// Multer storage configuration


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      const allowedTypes = /pdf|doc|docx|mp4/;
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.test(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOC, DOCX, and MP4 files are allowed'));
      }
    }
  }).single('file');

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

// START:: Delete Assignment
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
// END:: Delete Assignment

// START:: Add live class
const addLiveClass = async (req, res) => {
  try {
    const { title, description, date, time, link } = req.body;

    // Basic validation (optional)
    if (!title || !description || !date || !time || !link) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const newClass = new LiveClass({
      title,
      description,
      date,
      time,
      link,
    });

    const savedClass = await newClass.save();
    return res.status(201).json({ message: 'Live class created successfully', data: savedClass });
  } catch (error) {
    console.error('Error adding live class:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// END:: Add live class

// START:: GET /teachers/live-classes
const getLiveClass = async (req, res) => {
  try {
    const classes = await LiveClass.find().sort({ date: 1, time: 1 });
    res.status(200).json(classes);
  } catch (error) {
    console.error("Error fetching live classes:", error.message);
    res.status(500).json({ message: "Failed to retrieve live classes" });
  }
};
// END:: GET /teachers/live-classes

//START:: DELETE /teachers/live-classes/:id
const deleteLiveClass = async (req, res) => {
  const { id } = req.params;
  console.log("Received DELETE request for ID:", id);

  try {
    const deleted = await LiveClass.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Live class not found" });
    }
    res.status(200).json({ message: "Live class deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: "Failed to delete live class" });
  }
};
//END:: DELETE /teachers/live-classes/:id

// START:: Upload new resource
const uploadResources = (req, res) => {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
  
      const { title, description, subject } = req.body;
      if (!req.file || !title || !description || !subject) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const fileUrl = `/uploads/${req.file.filename}`;
  
      try {
        const newMaterial = new StudyMaterial({
          title,
          description,
          subject,
          fileUrl,
          fileName: req.file.originalname,
          fileType: req.file.mimetype,
          size: req.file.size,
        });
  
        await newMaterial.save();
  
        return res.status(201).json({
          message: 'Study material uploaded successfully',
          data: newMaterial,
        });
      } catch (saveError) {
        console.error(saveError);
        return res.status(500).json({ message: 'Failed to save study material' });
      }
    });
  };
// END:: Upload new resource

// START:: Fetch all study materials
const getAllMaterials = async (req, res) => {
    try {
      const materials = await StudyMaterial.find().sort({ createdAt: -1 });
      res.status(200).json(materials);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch materials', error: error.message });
    }
  };
  // End:: Fetch all study materials
  
  // START:: Update one material by id
  const updateMaterial = async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, subject } = req.body;
  
      const updated = await StudyMaterial.findByIdAndUpdate(
        id,
        { title, description, subject },
        { new: true }
      );
  
      if (!updated) {
        return res.status(404).json({ message: 'Study material not found' });
      }
  
      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update material', error: error.message });
    }
  };
  // END:: Update one material by id
  
  // START:: Delete one study material
  const deleteMaterial = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deleted = await StudyMaterial.findByIdAndDelete(id);
  
      if (!deleted) {
        return res.status(404).json({ message: 'Study material not found' });
      }
  
      res.status(200).json({ message: 'Study material deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete material', error: error.message });
    }
  };
  // END:: Delete one study material

  // START:: GET /students
const getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      const regex = new RegExp(search, 'i'); // Case-insensitive regex
      filter = {
        $or: [
          { name: regex },
          { indexnumber: regex }
        ]
      };
    }

    const students = await Student.find(filter).select('name indexnumber');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error while fetching students.' });
  }
};
  // END:: GET /students

  //START:: GET /students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student:', error.message);
    res.status(500).json({ message: 'Server error while fetching student.' });
  }
};
  //END:: GET /students/:id

  //START:: Update student details
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedStudent = await Student.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error.message);
    res.status(500).json({ message: 'Server error while updating student.' });
  }
};
  //END:: Update student details

  //START:: Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    res.status(200).json({ message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Error deleting student:', error.message);
    res.status(500).json({ message: 'Server error while deleting student.' });
  }
};
  //END:: Delete student

// GET /api/subjects
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 }); // sorted alphabetically
    const subjectNames = subjects.map((subj) => subj.name); // return only names
    res.status(200).json(subjectNames);
  } catch (err) {
    console.error('Error fetching subjects:', err.message);
    res.status(500).json({ error: 'Server error fetching subjects' });
  }
};

// POST /api/subjects
const createSubject = async (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ error: 'Subject name is required' });

  try {
    const existing = await Subject.findOne({ name });
    if (existing) return res.status(409).json({ error: 'Subject already exists' });

    const newSubject = new Subject({ name, code });
    await newSubject.save();

    res.status(201).json({ message: 'Subject added', subject: newSubject });
  } catch (err) {
    console.error('Error creating subject:', err.message);
    res.status(500).json({ error: 'Server error adding subject' });
  }
};

// GET /api/timetable
const getTimetable = async (req, res) => {
  try {
    let timetable = await Timetable.findOne().sort({ createdAt: -1 }); // Get latest if multiple

    if (!timetable) {
      return res.status(200).json({ timetable: {} }); // Return empty for first-time setup
    }

    return res.status(200).json({ timetable: timetable.timetable });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    return res.status(500).json({ error: 'Server error while fetching timetable' });
  }
};

// POST /api/timetable
const saveTimetable = async (req, res) => {
  try {
    const { timetable } = req.body;

    if (!timetable || typeof timetable !== 'object') {
      return res.status(400).json({ error: 'Invalid timetable format' });
    }

    const newTimetable = new Timetable({ timetable });
    await newTimetable.save();

    return res.status(201).json({ message: 'Timetable saved successfully ✅' });
  } catch (error) {
    console.error('Error saving timetable:', error);
    return res.status(500).json({ error: 'Server error while saving timetable' });
  }
};

// START:: POST /students
// Function to generate a new index number like "STU00001"
const generateIndexNumber = async () => {
  const lastStudent = await User.findOne({ role: 'student' }).sort({ createdAt: -1 });

  let nextNumber = 1;
  if (lastStudent && lastStudent.indexnumber) {
    const lastNumber = parseInt(lastStudent.indexnumber.replace('STU', ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `STU${nextNumber.toString().padStart(5, '0')}`;
};

const postStudents = async (req, res) => {
  try {
    const { name, email, phone, password, parent } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required student fields' });
    }

    // Check if student email already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({ message: 'Student with this email already exists' });
    }

    // Auto-generate index number
    const indexnumber = await generateIndexNumber();

    // Optional: validate parent data if provided
    let parentData = undefined;
    if (parent && parent.email) {
      parentData = {
        name: parent.name || '',
        email: parent.email,
        phone: parent.phone || '',
        password: parent.password || '',
        role: 'parent',
      };
    }

    const newStudent = new User({
      name,
      email,
      phone,
      password,
      role: 'student',
      indexnumber,
      parent: parentData,
    });

    const savedStudent = await newStudent.save();
    res.status(201).json({ message: 'Student created successfully', student: savedStudent });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// END:: POST /students



// CREATE notification
const postNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const newNotice = new Notification({ title, message });
    const saved = await newNotice.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// READ all notifications
const getNotifications = async (req, res) => {
  try {
    const notices = await Notification.find().sort({ date: -1 });
    res.status(200).json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// UPDATE notification by ID
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { title, message },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// DELETE notification by ID
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};


// GET: /teachers/results
const getResults = async (req, res) => {
  try {
    // Fetch all results and populate student name
    const results = await Result.find();

    res.json( results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// POST /save-results
const saveResults = async (req, res) => {
  try {
    const payload = req.body; // Array of student results

    for (const student of payload) {
      const { studentId, ...subjects } = student;

      await Result.findOneAndUpdate(
        { studentId },
        { studentId, results: subjects },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ message: 'Results saved successfully' });
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const checkInStudent = async (req, res) => {
  const { studentId } = req.body;
  const today = moment().format("YYYY-MM-DD");

  try {
    let attendance = await Attendance.findOne({ studentId, date: today });

    if (attendance) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    attendance = new Attendance({
      studentId,
      date: today,
      checkInTime: new Date().toISOString(),
    });
    await attendance.save();

    // Fetch student
    const student = await Student.findById(studentId);
    if (!student || !student.parent?.phone) {
      return res.status(404).json({ message: "Student or parent's phone number not found" });
    }

    // Send SMS
    const smsapikey = "d97868cc69d36af20e76";
    const message = `Hi, your child ${student.name} has checked in`;
    const to = student.parent.phone;
    const sender_id = "PrestigeLab";

    const smsUrl = `https://sms.smsnotifygh.com/smsapi?key=${smsapikey}&to=${to}&msg=${encodeURIComponent(
      message
    )}&sender_id=${sender_id}`;

    await axios.get(smsUrl);

    return res.json({ message: "Checked in successfully", attendance });
  } catch (error) {
    console.error("Check-in error:", error.message);
    return res.status(500).json({ message: "Check-in failed" });
  }
};

const checkOutStudent = async (req, res) => {
  const { studentId } = req.body;
  const today = moment().format("YYYY-MM-DD");

  try {
    // Check if attendance exists
    let attendance = await Attendance.findOne({ studentId, date: today });

    if (!attendance) {
      return res.status(400).json({ message: "Not checked in yet today" });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    // Update attendance
    attendance.checkOutTime = new Date().toISOString();
    await attendance.save();

    // Fetch student info
    const student = await Student.findById(studentId);
    if (!student || !student.parent?.phone) {
      return res.status(404).json({ message: "Student or parent's phone number not found" });
    }

    // Send SMS
    const smsapikey = "d97868cc69d36af20e76";
    const message = `Hi, your child ${student.name} has checked out`;
    const to = student.parent.phone;
    const sender_id = "PrestigeLab";

    const smsUrl = `https://sms.smsnotifygh.com/smsapi?key=${smsapikey}&to=${to}&msg=${encodeURIComponent(
      message
    )}&sender_id=${sender_id}`;

    await axios.get(smsUrl);

    return res.json({ message: "Checked out successfully", attendance });
  } catch (error) {
    console.error("Check-out error:", error.message);
    return res.status(500).json({ message: "Check-out failed" });
  }
};

const getAttendanceByDate = async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date is required in query (YYYY-MM-DD)' });
  }

  try {
    const records = await Attendance.find({ date });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};







// Export all functions properly
module.exports = {   postNotification,
  getNotifications, checkInStudent, checkOutStudent,
  updateNotification, getAttendanceByDate,
  deleteNotification,  getResults, saveResults,
  postAssignments, postStudents, getTimetable, saveTimetable,  getAllSubjects, createSubject, deleteStudent, updateStudent, getStudentById, getAllStudents, deleteLiveClass, getLiveClass, addLiveClass, getAssignments, editAssignments, deleteAssignment, uploadResources,   getAllMaterials,
    updateMaterial,
    deleteMaterial };
