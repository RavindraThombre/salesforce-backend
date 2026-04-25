const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const crypto = require("crypto");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
});

exports.createOrder = async (req, res) => {
    try {
        const { amount, courseId } = req.body;

        // 🔥 PREVENT DUPLICATE
        const existing = await Payment.findOne({
            studentId: req.user.id,
            courseId,
            status: "completed",
        });

        if (existing) {
            return res.status(400).json({
                message: "Already enrolled",
            });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        res.json({
            orderId: order.id,
            courseId,
            amount,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            courseId,
            isFree,
        } = req.body;

        if (isFree) {
            const existing = await Payment.findOne({
                studentId: req.user.id,
                courseId,
                status: "completed",
            });

            if (existing) {
                return res.json({ success: true });
            }

            await Payment.create({
                studentId: req.user.id,
                courseId,
                amount: 0,
                status: "completed",
                paymentType: "FREE", // ✅ OPTIONAL (nice to have)
            });

            return res.json({ success: true });
        }

        //Paid - VERIFY 
        const body =
            razorpay_order_id + "|" + razorpay_payment_id;

        const expected = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET)
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment",
            });
        }

        // 🔥 DOUBLE SAFETY CHECK
        const existing = await Payment.findOne({
            studentId: req.user.id,
            courseId,
            status: "completed",
        });

        if (existing) {
            return res.json({ success: true });
        }

        // ✅ SAVE PAYMENT
        await Payment.create({
            studentId: req.user.id,
            courseId,
            amount: 0,
            status: "completed",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

        res.json({ success: true });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};