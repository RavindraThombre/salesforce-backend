const Razorpay = require("razorpay");
const Payment = require("../models/Payment");
const Student = require("../models/Student");
const Course = require("../models/Course");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET,
});


// ==========================================
// GET FINAL COURSE AMOUNT
// ==========================================

const getCourseAmount = (course) => {
    const price = Number(course.price);
    const discountPrice = Number(course.discountPrice);

    const validPrice =
        Number.isFinite(price) && price > 0
            ? price
            : 0;

    const validDiscountPrice =
        Number.isFinite(discountPrice) &&
            discountPrice > 0 &&
            discountPrice < validPrice
            ? discountPrice
            : 0;

    return validDiscountPrice || validPrice;
};


// ==========================================
// VALIDATE FRONTEND AMOUNT
// ==========================================

const validateAmount = (frontendAmount, actualAmount) => {
    const amount = Number(frontendAmount);

    if (!Number.isFinite(amount)) {
        return false;
    }

    // Convert to paise to avoid decimal comparison issues
    return Math.round(amount * 100) ===
        Math.round(actualAmount * 100);
};


// ==========================================
// GET OR CREATE STUDENT
// ==========================================

const getStudent = async (userId) => {
    let student = await Student.findOne({
        userId,
    });

    if (!student) {
        student = await Student.create({
            userId,
            status: "Active",
        });
    }

    return student;
};


// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

exports.createOrder = async (req, res) => {
    try {
        const { amount, courseId } = req.body;

        // ------------------------------
        // VALIDATE COURSE ID
        // ------------------------------

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        // ------------------------------
        // VALIDATE FRONTEND AMOUNT
        // ------------------------------

        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Course amount is required",
            });
        }

        // ------------------------------
        // GET STUDENT
        // ------------------------------

        const student = await getStudent(
            req.user.id
        );

        // ------------------------------
        // GET COURSE
        // ------------------------------

        const course = await Course.findById(
            courseId
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // ------------------------------
        // GET DATABASE AMOUNT
        // ------------------------------

        const actualAmount =
            getCourseAmount(course);

        // ------------------------------
        // VALIDATE AMOUNT
        // ------------------------------

        const isValidAmount = validateAmount(
            amount,
            actualAmount
        );

        if (!isValidAmount) {
            console.error(
                "Amount validation failed:",
                {
                    courseId,
                    frontendAmount: amount,
                    actualAmount,
                    price: course.price,
                    discountPrice: course.discountPrice,
                }
            );

            return res.status(400).json({
                success: false,
                message: "Invalid course amount",
            });
        }

        // ------------------------------
        // CHECK FREE COURSE
        // ------------------------------

        if (actualAmount <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This is a free course. Razorpay order is not required.",
            });
        }

        // ------------------------------
        // PREVENT DUPLICATE ENROLLMENT
        // ------------------------------

        const existingPayment =
            await Payment.findOne({
                studentId: student._id,
                courseId,
                status: "completed",
            });

        if (existingPayment) {
            return res.status(400).json({
                success: false,
                message: "Already enrolled",
            });
        }

        // ------------------------------
        // CREATE RAZORPAY ORDER
        // ------------------------------

        const order =
            await razorpay.orders.create({
                amount: Math.round(
                    actualAmount * 100
                ),
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });

        return res.status(200).json({
            success: true,
            orderId: order.id,
            courseId,
            amount: actualAmount,
        });

    } catch (err) {
        console.error(
            "Create order error:",
            err
        );

        return res.status(500).json({
            success: false,
            message:
                err.message ||
                "Failed to create payment order",
        });
    }
};


// ==========================================
// VERIFY PAYMENT
// ==========================================

exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            courseId,
            amount,
        } = req.body;

        // ------------------------------
        // VALIDATE COURSE ID
        // ------------------------------

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required",
            });
        }

        // ------------------------------
        // GET STUDENT
        // ------------------------------

        const student = await getStudent(
            req.user.id
        );

        // ------------------------------
        // GET COURSE
        // ------------------------------

        const course = await Course.findById(
            courseId
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found",
            });
        }

        // ------------------------------
        // DATABASE SOURCE OF TRUTH
        // ------------------------------

        const actualAmount =
            getCourseAmount(course);

        // ==========================================
        // FREE COURSE
        // ==========================================

        if (actualAmount === 0) {

            const existingPayment =
                await Payment.findOne({
                    studentId: student._id,
                    courseId,
                    status: "completed",
                });

            if (existingPayment) {
                return res.status(200).json({
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

            return res.status(200).json({
                success: true,
                message:
                    "Free course enrolled successfully",
            });
        }

        // ==========================================
        // PAID COURSE VALIDATION
        // ==========================================

        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Course amount is required",
            });
        }

        const isValidAmount = validateAmount(
            amount,
            actualAmount
        );

        if (!isValidAmount) {
            console.error(
                "Verify amount validation failed:",
                {
                    courseId,
                    frontendAmount: amount,
                    actualAmount,
                    price: course.price,
                    discountPrice: course.discountPrice,
                }
            );

            return res.status(400).json({
                success: false,
                message: "Invalid course amount",
            });
        }

        // ==========================================
        // VALIDATE RAZORPAY DATA
        // ==========================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Incomplete payment information",
            });
        }

        // ==========================================
        // VERIFY RAZORPAY SIGNATURE
        // ==========================================

        const body =
            `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_SECRET
            )
            .update(body)
            .digest("hex");

        if (
            expectedSignature !==
            razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature",
            });
        }

        // ==========================================
        // PREVENT DUPLICATE PAYMENT
        // ==========================================

        const existingPayment =
            await Payment.findOne({
                studentId: student._id,
                courseId,
                status: "completed",
            });

        if (existingPayment) {
            return res.status(200).json({
                success: true,
                message: "Already enrolled",
            });
        }

        // ==========================================
        // SAVE PAYMENT
        // ==========================================

        await Payment.create({
            studentId: student._id,
            courseId,

            // Always save database amount
            amount: actualAmount,

            status: "completed",
            paymentType: "PAID",

            razorpayOrderId:
                razorpay_order_id,

            razorpayPaymentId:
                razorpay_payment_id,

            razorpaySignature:
                razorpay_signature,
        });

        // ==========================================
        // ENROLL STUDENT
        // ==========================================

        await Student.findByIdAndUpdate(
            student._id,
            {
                $addToSet: {
                    courses: courseId,
                },
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Payment successful and course enrolled",
        });

    } catch (err) {
        console.error(
            "Verify payment error:",
            err
        );

        return res.status(500).json({
            success: false,
            message:
                err.message ||
                "Payment verification failed",
        });
    }
};