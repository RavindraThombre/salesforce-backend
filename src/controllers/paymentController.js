const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const Course = require("../models/Course");
const crypto = require("crypto");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
});

const getStudent = async (userId) => {
    const student = await Student.findOne({
        userId,
    });

    if (!student) {
        throw new Error("Student profile not found");
    }

    return student;
};

exports.createOrder = async (req, res) => {
    try {
        const { amount, courseId } = req.body;

        // Get student using logged-in user
        const student = await getStudent(req.user.id);

        // Get course from database
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Backend source of truth
        const actualAmount = Number(course.price) || 0;

        // Frontend amount validation
        const frontendAmount = Number(amount) || 0;

        if (frontendAmount !== actualAmount) {
            return res.status(400).json({
                message: "Invalid course amount",
            });
        }

        // Prevent duplicate enrollment
        const existing = await Payment.findOne({
            studentId: student._id,
            courseId,
            status: "completed",
        });

        if (existing) {
            return res.status(400).json({
                message: "Already enrolled",
            });
        }

        // Prevent creating Razorpay order for free course
        if (actualAmount === 0) {
            return res.status(400).json({
                message: "This is a free course. Razorpay order is not required.",
            });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(actualAmount * 100),
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        res.json({
            orderId: order.id,
            courseId,
            amount: actualAmount,
        });

    } catch (err) {
        console.error("Create order error:", err);

        res.status(500).json({
            message: err.message,
        });
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
            amount,
        } = req.body;

        const student = await getStudent(req.user.id);

        // =====================================
        // GET ACTUAL COURSE PRICE FROM DATABASE
        // =====================================

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const actualAmount = Number(course.price) || 0;
        const frontendAmount = Number(amount) || 0;

        // Optional security check
        if (!isFree && frontendAmount !== actualAmount) {
            return res.status(400).json({
                success: false,
                message: "Invalid course amount",
            });
        }

        // =====================================
        // FREE COURSE
        // =====================================

        if (isFree || actualAmount === 0) {
            const existing = await Payment.findOne({
                studentId: student._id,
                courseId,
                status: "completed",
            });

            if (existing) {
                return res.json({
                    success: true,
                    message: "Already enrolled",
                });
            }

            await Payment.create({
                studentId: student._id,
                courseId,
                amount: 0,
                status: "completed",
                paymentType: "FREE",
            });

            await Student.findByIdAndUpdate(
                student._id,
                {
                    $addToSet: {
                        courses: courseId,
                    },
                }
            );

            return res.json({
                success: true,
                message: "Free course enrolled successfully",
            });
        }

        // =====================================
        // PAID COURSE - VERIFY RAZORPAY
        // =====================================

        const body =
            razorpay_order_id +
            "|" +
            razorpay_payment_id;

        const expected = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_SECRET
            )
            .update(body)
            .digest("hex");

        if (expected !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment",
            });
        }

        // Prevent duplicate payment
        const existing = await Payment.findOne({
            studentId: student._id,
            courseId,
            status: "completed",
        });

        if (existing) {
            return res.json({
                success: true,
                message: "Already enrolled",
            });
        }

        // =====================================
        // SAVE PAID PAYMENT
        // =====================================

        await Payment.create({
            studentId: student._id,
            courseId,
            amount: actualAmount, // Database amount
            status: "completed",
            paymentType: "PAID",

            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
        });

        // Add course to student enrollment
        await Student.findByIdAndUpdate(
            student._id,
            {
                $addToSet: {
                    courses: courseId,
                },
            }
        );

        res.json({
            success: true,
            message: "Payment successful and course enrolled",
        });

    } catch (err) {
        console.error(
            "Verify payment error:",
            err
        );

        res.status(500).json({
            message: err.message,
        });
    }
};