// controllers/adminStudentController.js

const Student = require("../models/Student");
// const User = require("../models/User");
// const Payment = require("../models/Payment");


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
        const student = await Student.findById(req.params.id)
            .populate("userId", "name email")
            .populate("courses");

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json(student);

    } catch (err) {
        res.status(500).json({ message: err.message });
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