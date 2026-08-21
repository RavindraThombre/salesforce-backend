const Student = require("../models/Student");
const Payment = require("../models/Payment");

const getStudentEnrollment = async (userId) => {
    const student = await Student.findOne({ userId })
        .populate("courses");

    const payments = await Payment.find({
        studentId: userId,
        status: "completed",
    })
        .populate("courseId")
        .sort({ createdAt: -1 });

    const courseMap = new Map();

    // Paid courses
    payments.forEach((payment) => {
        if (!payment.courseId) return;

        const courseId = payment.courseId._id.toString();

        courseMap.set(courseId, {
            course: payment.courseId,
            enrolledAt: payment.createdAt,
            price: payment.amount || 0,
            payment,
        });
    });

    // Free/directly enrolled courses
    student?.courses?.forEach((course) => {
        const courseId = course._id.toString();

        if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
                course,
                enrolledAt: student.createdAt,
                price: 0,
                payment: null,
            });
        }
    });

    return {
        student,
        payments,
        courseIds: [...courseMap.keys()],
        enrollments: [...courseMap.values()],
    };
};

module.exports = {
    getStudentEnrollment,
};