const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,

    price: Number,
    discountPrice: Number,

    thumbnail: String,
    duration: String,

    trainerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
    },

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
    },

    students: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        },
    ],

    liveClasses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LiveClass",
        },
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Course", courseSchema);