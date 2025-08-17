const assignmentsModel = require("../models/assignments.model");
const StudyMaterial = require("../models/studyMaterial.model");
const LiveClass = require("../models/Liveclass"); // adjust path to your model
const Student = require("../models/user.model");
const Result = require("../models/Result");
const Subject = require("../models/Subject");
const Notification = require("../models/Notification");
const Timetable = require("../models/Timetable");
const TheoryModel = require("../models/TheoryModel");
const User = require("../models/user.model");
const multer = require("multer");
const Attendance = require("../models/AttendanceModel");
const moment = require("moment"); // Optional for date formatting
const axios = require("axios");
require("dotenv").config();
const sheets = require("../utils/googleSheetsClient"); // Google Sheets client
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = "time table"; // Make sure this sheet exists
const supabase = require('./supabaseClient');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('file');





// START::  ASSIGNMENTS
const getAssignments = async (req, res) => {
  try {
    const response = await assignmentsModel.find();
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments", error });
  }
};

const postAssignments = async (req, res) => {
  const { title, dueDate, submissions, questions } = req.body;
  console.log("Assignment body received:", req.body);

  try {
    const response = await assignmentsModel.create({
      title,
      dueDate,
      submissions,
      questions,
    });

    // Flatten questions (as JSON string or count)
    const questionSummary = Array.isArray(questions)
      ? JSON.stringify(questions)
      : "";

    // Save to Google Sheet

    const { google } = require("googleapis");
    const { readFileSync } = require("fs");

    const auth = new google.auth.GoogleAuth({
      keyFile: "./credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    async function appendToSheet() {
      const client = await auth.getClient();
      const sheets = google.sheets({ version: "v4", auth: client });

      const values = [
        [
          response._id.toString(),
          title || "",
          dueDate ? new Date(dueDate).toLocaleDateString() : "",
          questionSummary,
          new Date().toLocaleString(),
        ],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: "assignments!A1", // Sheet name + cell range
        valueInputOption: "RAW",
        requestBody: {
          values,
        },
      });

      console.log("✅ Data appended to Google Sheet!");
    }

    appendToSheet().catch(console.error);
    res.status(200).json({ message: "Assignment saved" });

  } catch (error) {
    console.error("Error posting assignment:", error);
    res.status(500).json({ message: "Error posting assignment", error });
  }
};

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

    res.json({
      message: "Assignment updated successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating assignment", error });
  }
};

const deleteAssignment = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedAssignment = await assignmentsModel.findByIdAndDelete(id);

    if (!deletedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 1. Get the sheet metadata to find the sheet ID for "assignments"
    const sheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const assignmentsSheet = sheetMeta.data.sheets.find(
      (sheet) => sheet.properties.title.toLowerCase() === "assignments"
    );

    if (!assignmentsSheet) {
      return res
        .status(404)
        .json({ message: "Google Sheet 'assignments' not found" });
    }

    const sheetId = assignmentsSheet.properties.sheetId;

    // 2. Get all rows
    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "assignments!A2:Z", // Skip header
    });

    const rows = sheetData.data.values || [];

    // 3. Find the index of the row with matching _id
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return res
        .status(404)
        .json({ message: "Row with matching ID not found in sheet" });
    }

    // 4. Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1, // Add 1 to skip header
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });

    res.json({
      message: "Assignment deleted successfully",
      data: deletedAssignment,
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Error deleting assignment", error });
  }
};
// END:: ASSIGNMENTS

// START:: THEORIES
const postTheory = async (req, res) => {
  const { title, dueDate, submissions, questions } = req.body;
  console.log("Assignment body received:", req.body);

  try {
    const response = await TheoryModel.create({
      title,
      dueDate,
      submissions,
      questions,
    });
    res.status(200).json({ message: "Assignment saved" });

  } catch (error) {
    console.error("Error posting assignment:", error);
    res.status(500).json({ message: "Error posting assignment", error });
  }
};

const getTheory = async (req, res) => {
  try {
    const assignments = await TheoryModel.find().sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    console.error("Error fetching theory assignments:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const getTheoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find theory assignment by ID
    const theory = await TheoryModel.findById(id);

    if (!theory) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(theory);
  } catch (error) {
    console.error("Error fetching assignment by ID:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const updateTheoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await TheoryModel.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Merge existing questions with incoming updates
    if (req.body.questions) {
      req.body.questions = req.body.questions.map((q, i) => ({
        ...existing.questions[i]?._doc, // preserve old data
        ...q
      }));
    }

    const updatedTheory = await TheoryModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedTheory);
  } catch (error) {
    console.error("Error updating theory:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteTheoryById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the theory assignment
    const deletedAssignment = await TheoryModel.findByIdAndDelete(id);

    if (!deletedAssignment) {
      return res.status(404).json({ message: "Theory assignment not found" });
    }

    return res.json({ message: "Theory assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting theory assignment:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// END:: THEORIES


// START:: Add live class
const addLiveClass = async (req, res) => {
  try {
    const { title, description, date, time, link } = req.body;
    console.log("SUBMITTED:", req.body);

    if (!title || !description || !date || !time || !link) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields." });
    }

    // Save to MongoDB
    const newClass = new LiveClass({ title, description, date, time, link });
    const savedClass = await newClass.save();

    // Save to Google Sheets

    const values = [[title, description, date, time, link]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "live classes!A1",
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return res
      .status(201)
      .json({ message: "Live class created successfully", data: savedClass });
  } catch (error) {
    console.error("Error adding live class:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// END:: Add live class

// START:: GET /teachers/live-classes
const getLiveClass = async (req, res) => {
  try {
    const classes = await LiveClass.find().sort({ date: 1, time: 1 });
    console.log("✅ Live classes fetched:", classes);
    res.status(200).json(classes);
  } catch (error) {
    console.error("❌ Full error fetching live classes:", error);
    res.status(500).json({
      message: "Failed to retrieve live classes",
      error: error.message,
      stack: error.stack,
    });
  }
};

// END:: GET /teachers/live-classes

//START:: DELETE /teachers/live-classes/:id
const deleteLiveClass = async (req, res) => {
  const SHEET_Name = "live classes";
  const { id } = req.params;
  console.log("Received DELETE request for ID:", id);

  try {
    const deleted = await LiveClass.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Live class not found" });
    }

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_Name}!A2:F`,
    });

    const rows = sheetData.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === deleted.title); // match by title in column A

    if (rowIndex > -1) {
      const sheetMeta = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      const sheet = sheetMeta.data.sheets.find(
        (s) => s.properties.title === SHEET_Name
      );
      const sheetId = sheet.properties.sheetId;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex + 1, // +1 since we skipped header
                  endIndex: rowIndex + 2,
                },
              },
            },
          ],
        },
      });
    }

    res.status(200).json({ message: "Live class deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ message: "Failed to delete live class" });
  }
};
//END:: DELETE /teachers/live-classes/:id

// START:: MATERIAL RESOURCES
const uploadResources = (req, res) => {
  upload(req, res, async function (err) {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const { title, description, subject } = req.body;
    if (!req.file || !title || !description || !subject) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const file = req.file;
      const fileName = `${Date.now()}_${file.originalname}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('materials') // replace 'materials' with your bucket name
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Upload Error:", error);
        return res.status(500).json({ message: "Upload failed" });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('materials')
        .getPublicUrl(fileName);

      const fileUrl = publicUrlData.publicUrl;

      const newMaterial = new StudyMaterial({
        title,
        description,
        subject,
        fileUrl,
        fileName: file.originalname,
        fileType: file.mimetype,
        size: file.size,
      });

      await newMaterial.save();

      return res.status(201).json({
        message: "Study material uploaded successfully",
        data: newMaterial,
      });
    } catch (saveError) {
      console.error(saveError);
      return res.status(500).json({ message: "Failed to save study material" });
    }
  });
};

const getAllMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find().sort({ createdAt: -1 });
    res.status(200).json(materials);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch materials", error: error.message });
  }
};

const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject } = req.body;

    // Ensure at least one field is provided
    if (!title && !description && !subject) {
      return res.status(400).json({ message: "No update fields provided" });
    }

    const updated = await StudyMaterial.findByIdAndUpdate(
      id,
      { $set: { title, description, subject } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Study material not found" });
    }

    res.status(200).json({
      message: "Study material updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update material",
      error: error.message
    });
  }
};


const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the material first
    const material = await StudyMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ message: "Study material not found" });
    }

    // Extract the Supabase file path (assumes you saved filename as key)
    const filePath = material.fileUrl.split("/").pop(); // get the actual filename

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('materials') // your bucket name
      .remove([filePath]);

    if (storageError) {
      console.error("Supabase Storage Delete Error:", storageError);
      return res.status(500).json({ message: "Failed to delete file from storage" });
    }

    // Delete from MongoDB
    await StudyMaterial.findByIdAndDelete(id);

    res.status(200).json({ message: "Study material and file deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete material", error: error.message });
  }
};
// END:: MATERIAL RESOURCES

// START:: GET /students
const getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      const regex = new RegExp(search, "i"); // Case-insensitive regex
      filter = {
        $or: [{ name: regex }, { indexnumber: regex }],
      };
    }

    const students = await Student.find(filter).select(
      "name indexnumber phone parent.phone"
    );
    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error while fetching students." });
  }
};
// END:: GET /students

//START:: GET /students/:id
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    res.status(200).json(student);
  } catch (error) {
    console.error("Error fetching student:", error.message);
    res.status(500).json({ message: "Server error while fetching student." });
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
      return res.status(404).json({ message: "Student not found." });
    }

    res.status(200).json(updatedStudent);
  } catch (error) {
    console.error("Error updating student:", error.message);
    res.status(500).json({ message: "Server error while updating student." });
  }
};
//END:: Update student details

//START:: Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found." });
    }

    res.status(200).json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Error deleting student:", error.message);
    res.status(500).json({ message: "Server error while deleting student." });
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
    console.error("Error fetching subjects:", err.message);
    res.status(500).json({ error: "Server error fetching subjects" });
  }
};

// POST /api/subjects
const createSubject = async (req, res) => {
  const { name, code } = req.body;
  if (!name) return res.status(400).json({ error: "Subject name is required" });

  try {
    const existing = await Subject.findOne({ name });
    if (existing)
      return res.status(409).json({ error: "Subject already exists" });

    const newSubject = new Subject({ name, code });
    await newSubject.save();

    res.status(201).json({ message: "Subject added", subject: newSubject });
  } catch (err) {
    console.error("Error creating subject:", err.message);
    res.status(500).json({ error: "Server error adding subject" });
  }
};

//START:: GET /api/timetable
const getTimetable = async (req, res) => {
  try {
    let timetable = await Timetable.findOne().sort({ createdAt: -1 }); // Get latest if multiple

    if (!timetable) {
      return res.status(200).json({ timetable: {} }); // Return empty for first-time setup
    }

    return res.status(200).json({ timetable: timetable.timetable });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return res
      .status(500)
      .json({ error: "Server error while fetching timetable" });
  }
};
//END:: GET /api/timetable

//START:: POST /api/timetable
const saveTimetable = async (req, res) => {
  try {
    const { timetable } = req.body;

    if (!timetable || typeof timetable !== "object") {
      return res.status(400).json({ error: "Invalid timetable format" });
    }

    // Save to MongoDB
    const newTimetable = new Timetable({ timetable });
    await newTimetable.save();


       // Save to Google Sheet

       const { google } = require("googleapis");
       const { readFileSync } = require("fs");
   
       const auth = new google.auth.GoogleAuth({
         keyFile: "./credentials.json",
         scopes: ["https://www.googleapis.com/auth/spreadsheets"],
       });
    // Fetch existing data
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:Z`, // assuming header is in row 1
    });

    const existingRows = existing.data.values || [];

    // Create a map of existing rows by "Day" (column B / index 1)
    const existingMap = new Map();
    existingRows.forEach((row, index) => {
      const day = row[1]; // Assuming day is in column B
      if (day) existingMap.set(day, index + 2); // +2: because A2 is row 2
    });

    // Prepare rows and batch update
    const requests = [];

    for (const [day, schedule] of Object.entries(timetable)) {
      const rowValues = [new Date().toLocaleDateString(), day, ...schedule];
      const rowIndex = existingMap.get(day);

      if (rowIndex) {
        // Update existing row
        requests.push({
          range: `${SHEET_NAME}!A${rowIndex}`,
          values: [rowValues],
        });
      } else {
        // Append new row
        requests.push({
          append: true,
          values: [rowValues],
        });
      }
    }

    // Process updates
    for (const req of requests) {
      if (req.append) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1`,
          valueInputOption: "RAW",
          requestBody: { values: req.values },
        });
      } else {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: req.range,
          valueInputOption: "RAW",
          requestBody: { values: req.values },
        });
      }
    }

    return res
      .status(201)
      .json({ message: "Timetable saved and synced to Google Sheet ✅" });
  } catch (error) {
    console.error("Error saving timetable:", error);
    return res
      .status(500)
      .json({ error: "Server error while saving timetable" });
  }
};
//END:: POST /api/timetable

// START:: POST /students
// Function to generate a new index number like "STU00001"
const generateIndexNumber = async () => {
  const lastStudent = await User.findOne({ role: "student" }).sort({
    createdAt: -1,
  });

  let nextNumber = 1;
  if (lastStudent && lastStudent.indexnumber) {
    const lastNumber = parseInt(lastStudent.indexnumber.replace("STU", ""), 10);
    nextNumber = lastNumber + 1;
  }

  return `STU${nextNumber.toString().padStart(5, "0")}`;
};

const postStudents = async (req, res) => {
  try {
    const { name, email, phone, password, parent } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Missing required student fields" });
    }

    // Check if student email already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      return res
        .status(409)
        .json({ message: "Student with this email already exists" });
    }

    // Auto-generate index number
    const indexnumber = await generateIndexNumber();

    // Optional: validate parent data if provided
    let parentData = undefined;
    if (parent && parent.email) {
      parentData = {
        name: parent.name || "",
        email: parent.email,
        phone: parent.phone || "",
        password: parent.password || "",
        role: "parent",
      };
    }

    const newStudent = new User({
      name,
      email,
      phone,
      password,
      role: "student",
      indexnumber,
      parent: parentData,
    });

    const savedStudent = await newStudent.save();
    res
      .status(201)
      .json({ message: "Student created successfully", student: savedStudent });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ message: "Internal server error" });
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
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// READ all notifications
const getNotifications = async (req, res) => {
  try {
    const notices = await Notification.find().sort({ date: -1 });
    res.status(200).json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
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
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// DELETE notification by ID
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// GET: /teachers/results
const getResults = async (req, res) => {
  try {
    // Fetch all results and populate student name
    const results = await Result.find();

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /save-results
const saveResults = async (req, res) => {
  console.log("saving results");
  const SHEET_NAME_RESULTS = "results";

  try {
    const payload = req.body;
    console.log("PAYLOAD:", payload);

    for (const student of payload) {
      const { studentId, studentPhone, parentPhone, ...subjects } = student;

      // Save to MongoDB
      await Result.findOneAndUpdate(
        { studentId },
        { studentId, results: subjects },
        { upsert: true, new: true }
      );

      // Prepare data to insert into Google Sheet
      const sheetRows = Object.entries(subjects).map(([subject, scores]) => [
        studentId,
        studentPhone,
        parentPhone,
        subject,
        scores.class_score,
        scores.exam_score,
        new Date().toLocaleString(),
      ]);

      // 👇 Safe append: skip if offline or error
      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME_RESULTS}!A:G`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: sheetRows,
          },
        });
      } catch (sheetError) {
        console.error(
          "❌ Failed to sync with Google Sheets:",
          sheetError.message
        );
        // optionally: log to DB or continue silently
      }
    }

    res.status(200).json({ message: "Results saved successfully" });
  } catch (error) {
    console.error("Error saving results:", error);
    res.status(500).json({ error: "Internal server error" });
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

    const student = await Student.findById(studentId);
    if (!student || !student.parent?.phone) {
      return res
        .status(404)
        .json({ message: "Student or parent's phone number not found" });
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

    const values = [
      [
        student.name,
        student.phone || "",
        student.parent.phone || "",
        today,
        attendance.checkInTime,
        "", // Empty check-out field
        "Check-In",
      ],
    ];

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
      return res
        .status(404)
        .json({ message: "Student or parent's phone number not found" });
    }
    const values = [
      [
        student.name,
        student.phone || "",
        student.parent.phone || "",
        today,
        attendance.checkInTime,
        attendance.checkOutTime,
        "Check-Out",
      ],
    ];

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
    return res
      .status(400)
      .json({ error: "Date is required in query (YYYY-MM-DD)" });
  }

  try {
    const records = await Attendance.find({ date });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
};

// Export all functions properly
module.exports = {
  postNotification,
  getNotifications,
  checkInStudent,
  checkOutStudent,
  postTheory,
  updateNotification,
  getAttendanceByDate,
  deleteNotification,
  getResults,
  getTheoryById,
  updateTheoryById,
  deleteTheoryById,
  saveResults,
  postAssignments,
  postStudents,
  getTimetable,
  saveTimetable,
  getAllSubjects,
  createSubject,
  deleteStudent,
  updateStudent,
  getStudentById,
  getAllStudents,
  deleteLiveClass,
  getLiveClass,
  addLiveClass,
  getAssignments,
  editAssignments,
  deleteAssignment,
  uploadResources,
  getAllMaterials,
  updateMaterial,
  getTheory,
  deleteMaterial,
};
