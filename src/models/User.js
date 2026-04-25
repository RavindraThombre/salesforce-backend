const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
    },
    password: String,

    role: {
        type: String,
        enum: ["admin", "student", "trainer"],
        default: "student",
    },

    bio: {
        type: String,
        default: "",
    },

    expertise: {
        type: String,
        default: "",
    },

    avatar: {
        type: String, // stores image path
        default: "",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("User", userSchema);