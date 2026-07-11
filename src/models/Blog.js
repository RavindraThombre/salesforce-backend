const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
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

        content: {
            type: String,
            default: "",
        },

        image: {
            type: String,
            default: "",
        },

        // Cloudinary public_id
        imagePublicId: {
            type: String,
            default: "",
        },

        author: {
            type: String,
            default: "Admin",
        },

        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Blog", blogSchema);