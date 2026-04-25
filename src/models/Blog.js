// models/Blog.js

const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    content: String,
    image: String,
    author: {
        type: String,
        default: "Admin",
    },

    isPublished: {
        type: Boolean,
        default: true, // ✅ ADD THIS (important)
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Blog", blogSchema);