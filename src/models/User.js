const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
            required: true,
        },

        password: {
            type: String,
            default: null,
            // required: true,
        },
        googleId: {
            type: String,
            default: null,
            unique: true,
            sparse: true,
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },

        phone: {
            type: String,
            default: "",
            trim: true,
        },

        city: {
            type: String,
            default: "",
            trim: true,
        },

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
            type: String,
            default: "",
        },

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);