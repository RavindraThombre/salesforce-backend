const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },

    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },

    paymentType: {
        type: String,
        enum: ["FREE", "PAID"],
        required: true,
        default: "FREE", // ✅ safe default
    },

    // 🔥 RAZORPAY FIELDS
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Payment", paymentSchema);