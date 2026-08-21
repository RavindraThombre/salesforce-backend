// controllers/adminStudentController.js
const Student = require("../models/Student");
const Payment = require("../models/Payment");

// ✅ GET ALL STUDENTS (ADMIN)
exports.getAllStudentsAdmin = async (req, res) => {
    try {
        const students = await Student.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 });
        res.set("Cache-Control", "no-store"); // prevent caching
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getStudentDetailsAdmin = async (req, res) => {
    try {
        const studentId = req.params.id;

        // 1. Student + User details
        const student = await Student.findById(studentId)
            .populate(
                "userId",
                "name email phone city avatar role"
            )
            .populate("courses")
            .populate("certificates.courseId")
            .populate("progress.courseId");

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
            });
        }

        // 2. Full payment history
        const payments = await Payment.find({
            studentId: student._id,
        })
            .populate("courseId")
            .sort({ createdAt: -1 });

        // 3. Courses directly enrolled
        const studentCourses = student.courses || [];

        // 4. Courses from completed payments only
        const paymentCourses = payments
            .filter(
                (payment) =>
                    payment.courseId &&
                    payment.status === "completed"
            )
            .map((payment) => payment.courseId);

        // 5. Merge courses and remove duplicates
        const courseMap = new Map();

        [...studentCourses, ...paymentCourses].forEach(
            (course) => {
                if (course?._id) {
                    courseMap.set(
                        course._id.toString(),
                        course
                    );
                }
            }
        );

        const enrolledCourses = Array.from(
            courseMap.values()
        );

        // 6. Completed payments
        const completedPayments = payments.filter(
            (payment) =>
                payment.status === "completed"
        );

        // 7. Calculate total payment amount
        const totalPayments = completedPayments.reduce(
            (total, payment) => {
                return (
                    total +
                    (Number(payment.amount) || 0)
                );
            },
            0
        );

        // 8. Response
        res.set("Cache-Control", "no-store");

        res.status(200).json({
            student: {
                _id: student._id,
                name: student.userId?.name || "",
                email: student.userId?.email || "",
                phone: student.userId?.phone || "",
                city: student.userId?.city || "",
                avatar: student.userId?.avatar || "",
                role: student.userId?.role || "",
                status: student.status,
                createdAt: student.createdAt,
            },

            enrolledCourses,

            payments,

            certificates:
                student.certificates || [],

            progress:
                student.progress || [],

            statistics: {
                enrolledCoursesCount:
                    enrolledCourses.length,

                totalPayments,

                certificatesCount:
                    student.certificates?.length || 0,

                paymentsCount:
                    payments.length,

                completedPaymentsCount:
                    completedPayments.length,
            },
        });
    } catch (error) {
        console.error(
            "Get student details error:",
            error
        );

        res.status(500).json({
            message: error.message,
        });
    }
};

// ✅ GET FULL STUDENT DETAILS (ADMIN)
// exports.getStudentDetailsAdmin = async (req, res) => {
//     try {
//         const studentId = req.params.id;

//         // 🔹 Student Info

//         const student = await Student.findById(studentId)
//             .populate("userId", "name email")
//             .populate("courses");

//         if (!student) {
//             return res.status(404).json({ message: "Student not found" });
//         }

//         // 🔹 Payments + Course Info
//         const payments = await Payment.find({ studentId })
//             .populate("courseId")
//             .sort({ createdAt: -1 });

//         // 🔹 Enrolled Courses
//         const courses = payments
//             .filter((p) => p.courseId)
//             .map((p) => ({
//                 _id: p.courseId._id,
//                 title: p.courseId.title,
//             }));

//         // 🔹 Certificates (completed payments)
//         const certificates = payments
//             .filter((p) => p.status === "completed")
//             .map((p) => `${p.courseId?.title} Certificate`);

//         res.json({
//             student,
//             courses,
//             payments,
//             certificates,
//         });

//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };