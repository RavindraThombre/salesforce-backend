const mongoose = require("mongoose");
const { APPLICATION_STATUS_LIST, APPLICATION_STATUS } = require("../constants/applicationStatus");

const JobApplicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobPosition",
            required: true,
        },

        applicant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            required: true,
        },

        resume: {
            url: {
                type: String,
                required: true,
            },
            fileName: {
                type: String,
                required: true,
            },
        },

        coverLetter: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: APPLICATION_STATUS_LIST,
            default: APPLICATION_STATUS.APPLIED,
        },

        appliedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "JobApplication",
    JobApplicationSchema
);