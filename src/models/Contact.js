const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,

    // ✅ NEW FIELDS
    reply: {
        type: String,
        default: "",
    },

    status: {
        type: String,
        enum: ["New", "Replied", "Closed"],
        default: "New",
    },

    repliedAt: Date,

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Contact", contactSchema);