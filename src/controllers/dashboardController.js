const User = require("../models/User");
const Course = require("../models/Course");
const Payment = require("../models/Payment");
const LiveClass = require("../models/LiveClass");

exports.getAdminDashboard = async (req, res) => {
    try {
        const { year, month } = req.query;

        /* ---------------- DATE FILTER ---------------- */

        let startDate = new Date("2000-01-01");
        let endDate = new Date();

        if (year) {
            startDate = new Date(year, month ? month - 1 : 0, 1);
            endDate = new Date(year, month ? month : 12, 0);
        }

        /* ---------------- COUNTS ---------------- */

        const totalStudents = await User.countDocuments({ role: "student" });
        const totalAdmins = await User.countDocuments({ role: "admin" });
        const totalCourses = await Course.countDocuments();
        const totalClasses = await LiveClass.countDocuments();

        /* ---------------- PAYMENTS ---------------- */

        const payments = await Payment.find({
            createdAt: { $gte: startDate, $lte: endDate },
        });

        const totalRevenue = payments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
        );

        /* ---------------- STUDENT GROWTH ---------------- */

        const users = await User.find({
            createdAt: { $gte: startDate, $lte: endDate },
        });

        const studentGrowthMap = {};

        users.forEach((u) => {
            const month = new Date(u.createdAt).toLocaleString("default", {
                month: "short",
            });
            studentGrowthMap[month] = (studentGrowthMap[month] || 0) + 1;
        });

        const studentGrowthData = Object.entries(studentGrowthMap).map(
            ([month, count]) => ({
                month,
                students: count,
            })
        );

        /* ---------------- REVENUE CHART ---------------- */

        const revenueMap = {};

        payments.forEach((p) => {
            const month = new Date(p.createdAt).toLocaleString("default", {
                month: "short",
            });
            revenueMap[month] = (revenueMap[month] || 0) + (p.amount || 0);
        });

        const revenueData = Object.entries(revenueMap).map(
            ([month, revenue]) => ({
                month,
                revenue,
            })
        );

        /* ---------------- TOP COURSES ---------------- */

        const topCourses = await Payment.aggregate([
            {
                $group: {
                    _id: "$courseId",
                    revenue: { $sum: "$amount" },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
        ]);

        /* ---------------- USER ACTIVITY ---------------- */

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("name email role createdAt");

        const recentPayments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(5);

        const totalTrainers = await User.countDocuments({ role: "trainer" });

        res.json({
            totalStudents,
            totalAdmins,
            totalCourses,
            totalTrainers,
            totalClasses,
            totalRevenue,

            studentGrowthData,
            revenueData,
            topCourses,

            recentUsers,
            recentPayments,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};