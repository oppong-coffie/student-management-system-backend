const assignmentsModel = require("../models/assignments.model");
const StudyMaterial = require("../models/studyMaterial.model")
const LiveClass = require('../models/Liveclass'); // adjust path to your model
const Student = require('../models/user.model')
const path = require('path');
const multer = require('multer');
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








// Export all functions properly
module.exports = { postAssignments, deleteStudent, updateStudent, getStudentById, getAllStudents, deleteLiveClass, getLiveClass, addLiveClass, getAssignments, editAssignments, deleteAssignment, uploadResources,   getAllMaterials,
    updateMaterial,
    deleteMaterial };
