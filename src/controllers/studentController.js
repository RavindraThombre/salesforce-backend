const Payment = require("../models/Payment");
const LiveClass = require("../models/LiveClass");
const Student = require("../models/Student");
const Certificate = require("../models/Certificate");

/* ================= DASHBOARD ================= */
exports.getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({
            userId,
        }).populate("courses");

        if (!student) {
            return res.json({
                totalCourses: 0,
                totalLiveClasses: 0,
                totalCertificates: 0,
                upcomingClass: null,
                courseProgress: [],
                activity: [],
            });
        }

        const payments = await Payment.find({
            studentId: userId,
            status: "completed",
        })
            .populate("courseId")
            .sort({ createdAt: -1 });

        const courseMap = new Map();

        // =========================
        // FREE ENROLLED COURSES
        // =========================
        student.courses.forEach((course) => {
            if (course?._id) {
                courseMap.set(
                    course._id.toString(),
                    course
                );
            }
        });

        // =========================
        // PAID COURSES
        // =========================
        payments.forEach((payment) => {
            if (payment.courseId?._id) {
                courseMap.set(
                    payment.courseId._id.toString(),
                    payment.courseId
                );
            }
        });

        const courseIds = Array.from(courseMap.keys());

        const totalCourses = courseIds.length;

        const liveClasses = await LiveClass.find({
            courseId: {
                $in: courseIds,
            },
        });

        const totalLiveClasses = liveClasses.length;

        const certificates = await Certificate.find({
            studentId: student._id,
        });

        const totalCertificates = certificates.length;

        const now = new Date();

        const upcomingClass = await LiveClass.findOne({
            courseId: {
                $in: courseIds,
            },
            date: {
                $gte: now,
            },
        })
            .populate("courseId", "title")
            .sort({
                date: 1,
            });

        const courseProgress = Array.from(
            courseMap.values()
        ).map((course) => ({
            courseName: course.title,
            progress: 0,
        }));

        const paymentActivity = payments.map((payment) => ({
            type: "payment",
            text: `Enrolled in ${payment.courseId?.title || "Course"
                }`,
            date: payment.createdAt,
        }));

        const activity = paymentActivity
            .sort(
                (a, b) =>
                    new Date(b.date) - new Date(a.date)
            )
            .slice(0, 5);

        res.json({
            totalCourses,
            totalLiveClasses,
            totalCertificates,
            upcomingClass,
            courseProgress,
            activity,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};
/* ================= UPCOMING CLASSES ================= */
exports.getUpcomingClasses = async (req, res) => {
    try {
        const student = await Student.findOne({
            userId: req.user.id,
        });

        // ✅ FIX: prevent crash
        if (!student) return res.json([]);

        const now = new Date();

        const classes = await LiveClass.find({
            courseId: { $in: student.courses },
            date: { $gte: now },
        })
            .populate("courseId", "title")
            .sort({ date: 1 })
            .limit(5);

        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= MY COURSES ================= */
exports.getMyCourses = async (req, res) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({
            userId,
        }).populate("courses");

        if (!student) {
            return res.json([]);
        }

        const payments = await Payment.find({
            studentId: userId,
            status: "completed",
        })
            .populate("courseId")
            .sort({ createdAt: -1 });

        const courseMap = new Map();

        // =========================
        // FREE / DIRECT ENROLLMENT
        // =========================
        student.courses.forEach((course) => {
            if (!course?._id) return;

            courseMap.set(course._id.toString(), {
                _id: course._id,
                title: course.title,
                price: course.price || 0,
                enrolledAt: student.createdAt,
            });
        });

        // =========================
        // PAID ENROLLMENT
        // =========================
        payments.forEach((payment) => {
            const course = payment.courseId;
            if (!course?._id) return;
            courseMap.set(course._id.toString(), {
                _id: course._id,
                title: course.title,
                price: payment.amount || 0,
                enrolledAt: payment.createdAt,
            });
        });

        const courses = Array.from(courseMap.values());

        res.json(courses);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

/* ================= COURSE DETAIL ================= */
exports.getCourseDetail = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const student = await Student.findOne({
            userId,
            courses: courseId,
        });

        const payment = await Payment.findOne({
            studentId: userId,
            courseId,
            status: "completed",
        }).populate("courseId", "title");

        if (!student && !payment) {
            return res.status(403).json({
                message: "You are not enrolled in this course",
            });
        }

        let title = payment?.courseId?.title;

        if (!title) {
            const enrolledStudent = await Student.findOne({
                userId,
            }).populate({
                path: "courses",
                match: {
                    _id: courseId,
                },
            });

            title =
                enrolledStudent?.courses?.[0]?.title ||
                "Course";
        }

        const liveClasses = await LiveClass.find({
            courseId,
        }).sort({
            date: 1,
        });

        const recordings = [];

        res.json({
            _id: courseId,
            title,
            liveClasses,
            recordings,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

/* ================= LIVE CLASSES ================= */
exports.getStudentLiveClasses = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await Payment.find({
            studentId: userId,
            status: "completed",
        }).populate("courseId");

        const courseIds = payments.map((p) => p.courseId?._id);

        const classes = await LiveClass.find({
            courseId: { $in: courseIds },
        })
            .populate("courseId", "title instructor")
            .sort({ date: 1 });

        const now = new Date();

        const result = classes.map((cls) => {
            let status = "Upcoming";

            if (cls.date < now) status = "Completed";

            const start = new Date(cls.date).getTime();
            const end = start + 60 * 60 * 1000;

            if (Date.now() >= start && Date.now() <= end) {
                status = "Live";
            }

            return {
                _id: cls._id,
                title: cls.courseId?.title,
                instructor: cls.courseId?.trainer || "Instructor",
                topic: cls.topic,
                date: cls.date,
                time: cls.time,
                zoomLink: cls.zoomLink,
                status,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= PAYMENTS ================= */
exports.getStudentPayments = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await Payment.find({
            studentId: userId,
        })
            .populate("courseId", "title")
            .sort({ createdAt: -1 });

        const result = payments.map((p) => ({
            _id: p._id,
            course: p.courseId?.title || "Course",
            amount: p.amount,
            date: p.createdAt,
            status: p.status === "completed" ? "Paid" : "Pending",
            invoiceUrl: `/invoices/${p._id}.pdf`,
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= CERTIFICATES ================= */
exports.getStudentCertificates = async (req, res) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({ userId }).populate(
            "userId",
            "name"
        ); // ✅ FIX

        if (!student) return res.json([]);

        const certificates = await Certificate.find({
            studentId: student._id,
        })
            .populate("courseId", "title")
            .sort({ issuedAt: -1 });

        const result = certificates.map((cert) => ({
            _id: cert._id,
            course: cert.courseId?.title,
            student: student.userId?.name || "Student",
            date: cert.issuedAt,
            certificateUrl: cert.certificateUrl,
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= CHECK ENROLLMENT ================= */
exports.checkEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const studentEnrollment = await Student.exists({
            userId,
            courses: courseId,
        });

        const paymentEnrollment = await Payment.exists({
            studentId: userId,
            courseId,
            status: "completed",
        });

        const enrolled =
            !!studentEnrollment ||
            !!paymentEnrollment;

        res.json({
            enrolled,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};