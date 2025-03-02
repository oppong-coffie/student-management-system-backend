const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

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

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Email does not exist" });

        if (password !== user.password) return res.status(400).json({ message: "Incorrect password" });

        // ✅ Send user details to frontend
        res.json({
            id: user._id,
            name: user.name,
            role: user.role,
            message: "Login successful",
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};


