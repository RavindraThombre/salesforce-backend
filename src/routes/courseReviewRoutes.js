const express = require("express");

const router = express.Router();

const {
    submitCourseReview,
    getCourseReviews,
    getMyCourseReview,
    getCourseRatingSummary,
} = require("../controllers/courseReviewController");

const { verifyToken } = require("../middleware/authMiddleware");

// Submit or update course review
router.post("/", verifyToken, submitCourseReview);
// Get all reviews for a course
router.get("/course/:courseId", getCourseReviews);

// Get rating summary
router.get(
    "/course/:courseId/summary",
    getCourseRatingSummary
);

// Get logged-in student's review
router.get("/my/:courseId", verifyToken, getMyCourseReview);

module.exports = router;