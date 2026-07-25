const mongoose = require("mongoose");
const { CONTACT_STATUS } = require("../constants/contactStatus");

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
        enum: Object.values(CONTACT_STATUS),
        default: CONTACT_STATUS.NEW,
    },

    repliedAt: Date,

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Contact", contactSchema);