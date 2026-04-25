const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    phone: String,
    city: String,

    // ✅ enrolled courses
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        },
    ],

    // ❌ REMOVE THIS (use Payment collection instead)
    // payments: [Number],

    // ✅ BETTER CERTIFICATE STRUCTURE
    certificates: [
        {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
            certificateUrl: String,
            issuedAt: Date,
        },
    ],

    // 🔥 OPTIONAL (VERY USEFUL)
    progress: [
        {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
            percentage: {
                type: Number,
                default: 0,
            },
        },
    ],

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Student", studentSchema);