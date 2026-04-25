// controllers/adminPaymentController.js

const Payment = require("../models/Payment");
const Certificate = require("../models/Certificate");
const { generateCertificate } = require("../utils/generateCertificate");

exports.getAllPaymentsAdmin = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate({
                path: "studentId",
                populate: {
                    path: "userId",
                    select: "name email",
                },
            })
            .populate("courseId", "title")
            .sort({ createdAt: -1 });

        const formatted = payments.map((p) => ({
            _id: p._id,
            student: p.studentId?.userId?.name || "N/A",
            email: p.studentId?.userId?.email || "N/A",
            course: p.courseId?.title || "N/A",
            amount: p.amount,
            status: p.status,
            date: p.createdAt,
        }));

        res.set("Cache-Control", "no-store");
        res.json(formatted);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status } = req.body;

        const payment = await Payment.findById(paymentId)
            .populate("courseId", "title")
            .populate({
                path: "studentId",
                populate: {
                    path: "userId",
                    select: "name email",
                },
            });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // ✅ update status
        payment.status = status;
        await payment.save();

        /* ================= CERTIFICATE AUTO GENERATE ================= */

        if (status === "completed") {
            const existing = await Certificate.findOne({
                studentId: payment.studentId,
                courseId: payment.courseId,
            });

            if (!existing) {
                const fileName = `${payment._id}`;

                generateCertificate({
                    studentName:
                        payment.studentId?.userId?.name || "Student",
                    courseName: payment.courseId?.title || "Course",
                    fileName,
                    verificationId, // 🔥 PASS payment ID as verification ID
                });

                await Certificate.create({
                    studentId: payment.studentId,
                    courseId: payment.courseId,
                    certificateUrl: `/certificates/${fileName}.pdf`,
                    verificationId, // 🔥 SAVE verification ID in DB
                });
            }

            // 🔔 NOTIFICATION
            await Notification.create({
                userId: payment.studentId.userId,
                title: "Payment Successful 🎉",
                desc: `Your payment for ${payment.courseId?.title} is verified. Certificate generated.`,
            });
        }

        res.json({ message: "Payment updated + certificate generated" });

    } catch (err) {
        console.error("Payment Error:", err);
        res.status(500).json({ message: err.message });
    }
};