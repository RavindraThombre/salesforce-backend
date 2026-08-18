const mongoose = require("mongoose");

const JobPositionSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        banner: {
            type: String,
            default: "",
        },

        department: {
            type: String,
            required: true,
            trim: true,
        },

        employmentType: {
            type: String,
            enum: [
                "Full Time",
                "Part Time",
                "Internship",
                "Contract",
                "Remote",
            ],
            default: "Full Time",
        },

        location: {
            type: String,
            default: "Remote",
        },

        experience: {
            min: {
                type: Number,
                default: 0,
            },
            max: {
                type: Number,
                default: 0,
            },
        },

        salary: {
            min: {
                type: Number,
                default: 0,
            },
            max: {
                type: Number,
                default: 0,
            },
        },

        openings: {
            type: Number,
            default: 1,
        },

        skills: [
            {
                type: String,
                trim: true,
            },
        ],

        description: {
            type: String,
            default: "",
        },

        responsibilities: {
            type: String,
            default: "",
        },

        requirements: {
            type: String,
            default: "",
        },

        benefits: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["Draft", "Published", "Closed"],
            default: "Draft",
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("JobPosition", JobPositionSchema);