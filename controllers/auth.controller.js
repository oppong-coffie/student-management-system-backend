const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const Teacher = require("../models/teacher.model");

// User Registration
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// User Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Check if email belongs to a student (User)
        let user = await User.findOne({ email });
        if (user) {
            if (password !== user.password) {
                return res.status(400).json({ message: "Incorrect password" });
            }

            return res.json({
                id: user._id,
                index: user.indexnumber,
                name: user.name,
                email: user.email,
                role: user.role,
                message: "Login successful (student)",
            });
        }

        // 2. Check if email matches any parent inside a student record
        const parentOwner = await User.findOne({ "parent.email": email });
        if (parentOwner) {
            const parent = parentOwner.parent;
            if (parent.password !== password) {
                return res.status(400).json({ message: "Incorrect parent password" });
            }

            return res.json({
                id: parentOwner._id,
                index: parentOwner.indexnumber,
                name: parent.name,
                email: parent.email,
                phone: parent.phone,
                role: parent.role,
                message: "Login successful (parent)",
            });
        }

        // 3. Check teachers
        const teacher = await Teacher.findOne({ email });
        if (teacher) {
            if (password !== teacher.password) {
                return res.status(400).json({ message: "Incorrect password" });
            }

            return res.json({
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                role: "teacher",
                message: "Login successful (teacher)",
            });
        }

        return res.status(400).json({ message: "Email does not exist" });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


