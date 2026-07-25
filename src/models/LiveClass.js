const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },

    course: String,

    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    level: String,

    topic: {
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    time: {
        type: String,
        required: true,
    },

    startTime: {
        type: Date,
        required: true,
    },

    endTime: {
        type: Date,
        required: true,
    },

    durationMinutes: {
        type: Number,
        required: true,
    },

    timezone: {
        type: String,
        default: "Asia/Kolkata",
    },

    zoomLink: String,

    isFree: {
        type: Boolean,
        default: false,
    },

    reminderSent: {
        type: Boolean,
        default: false,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("LiveClass", liveClassSchema);