const Payment = require("../models/Payment");
const LiveClass = require("../models/LiveClass");
const Student = require("../models/Student");
const Certificate = require("../models/Certificate");

/* ================= DASHBOARD ================= */
exports.getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await Payment.find({ studentId: userId })
            .populate("courseId")
            .sort({ createdAt: -1 });

        // ✅ FIX: remove duplicates
        const courseIds = [
            ...new Set(
                payments
                    .map((p) => p.courseId?._id?.toString())
                    .filter(Boolean)
            ),
        ];

        const totalCourses = courseIds.length;

        const liveClasses = await LiveClass.find({
            courseId: { $in: courseIds },
        });

        const totalLiveClasses = liveClasses.length;

        const totalCertificates = payments.filter(
            (p) => p.status === "completed"
        ).length;

        const now = new Date();

        const upcomingClass = await LiveClass.findOne({
            courseId: { $in: courseIds },
            date: { $gte: now },
        })
            .populate("courseId", "title")
            .sort({ date: 1 });

        const courseProgressMap = {};

        payments.forEach((p) => {
            const courseName = p.courseId?.title || "Course";
            const progress = p.status === "completed" ? 100 : 30;
            courseProgressMap[courseName] = progress;
        });

        const courseProgress = Object.keys(courseProgressMap).map(
            (courseName) => ({
                courseName,
                progress: courseProgressMap[courseName],
            })
        );

        const paymentActivity = payments.map((p) => ({
            type: "payment",
            text: `Enrolled in ${p.courseId?.title || "Course"}`,
            date: p.createdAt,
        }));

        const classActivity = liveClasses.map((c) => ({
            type: "class",
            text: `Attended ${c.topic}`,
            date: c.date,
        }));

        const activity = [...paymentActivity, ...classActivity]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
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
        res.status(500).json({ message: err.message });
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

        const payments = await Payment.find({
            studentId: userId,
            status: "completed",
        })
            .populate("courseId")
            .sort({ createdAt: -1 });

        const courses = payments.map((p) => ({
            _id: p.courseId?._id,
            title: p.courseId?.title,
            price: p.amount || 0,
            enrolledAt: p.createdAt,
        }));

        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ================= COURSE DETAIL ================= */
exports.getCourseDetail = async (req, res) => {
    try {
        const { courseId } = req.params;

        const payment = await Payment.findOne({
            studentId: req.user.id,
            courseId,
            status: "completed",
        }).populate("courseId", "title"); // ✅ FIX

        if (!payment) {
            return res.status(403).json({
                message: "You are not enrolled in this course",
            });
        }

        const liveClasses = await LiveClass.find({ courseId }).sort({
            date: 1,
        });

        const recordings = [];

        res.json({
            _id: courseId,
            title: payment.courseId?.title,
            liveClasses,
            recordings,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        const existing = await Payment.findOne({
            studentId: req.user.id,
            courseId,
            status: "completed",
        });

        res.json({ enrolled: !!existing });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};