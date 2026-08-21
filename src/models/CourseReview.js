const mongoose = require("mongoose");

const courseReviewSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        review: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// One student can review a course only once
courseReviewSchema.index(
    {
        course: 1,
        student: 1,
    },
    {
        unique: true,
    }
);

module.exports = mongoose.model(
    "CourseReview",
    courseReviewSchema
);