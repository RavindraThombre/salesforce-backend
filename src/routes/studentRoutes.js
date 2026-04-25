const express = require("express");
const router = express.Router();

const { getStudentDashboard, getUpcomingClasses, getMyCourses, getCourseDetail, getStudentLiveClasses, getStudentCertificates, getStudentPayments, checkEnrollment } = require("../controllers/studentController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/dashboard", verifyToken, getStudentDashboard);
router.get("/upcoming-classes", verifyToken, getUpcomingClasses);
router.get("/my-courses", verifyToken, getMyCourses);
router.get("/course/:courseId", verifyToken, getCourseDetail);
router.get("/live-classes", verifyToken, getStudentLiveClasses);
router.get("/payments", verifyToken, getStudentPayments);
router.get("/certificates", verifyToken, getStudentCertificates);
router.get("/check-enrollment/:courseId", verifyToken, checkEnrollment)
module.exports = router;