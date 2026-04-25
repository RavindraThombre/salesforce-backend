const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    verificationId: {
        type: String,
        unique: true,
    },
    certificateUrl: {
        type: String,
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Certificate", certificateSchema);