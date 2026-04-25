const mongoose = require("mongoose");

const liveClassSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    course: String,     // display name (fast UI)
    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    level: String,
    topic: String,
    date: Date,
    time: String,
    zoomLink: String,

    isFree: {
        type: Boolean,
        default: false,
    },

    // ✅ ADD HERE 👇 (IMPORTANT)
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