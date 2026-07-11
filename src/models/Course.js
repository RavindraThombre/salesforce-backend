const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        price: Number,

        discountPrice: Number,

        thumbnail: {
            type: String,
            default: "",
        },

        thumbnailPublicId: {
            type: String,
            default: "",
        },

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

        students: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
        }],

        liveClasses: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "LiveClass",
        }],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Course", courseSchema);