const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, }, // "student", "teacher", "parent"

    indexnumber: { type: String }, // Only for students

    parent: {
        name: { type: String },
        email: { type: String },
        phone: { type: String },
        password: { type: String },
        role: { type: String }, // "parent"
    }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
