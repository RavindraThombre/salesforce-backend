const express = require("express");
const router = express.Router();
const Certificate = require("../models/Certificate");
const { getPublicCourses, getPublicCourseById, getPublicBlogs, getPublicBlogById, getPublicTestimonials, getLiveClasses } = require("../controllers/publicController");

router.get("/verify/:id", async (req, res) => {
    try {
        const cert = await Certificate.findOne({
            verificationId: req.params.id,
        })
            .populate("courseId", "title")
            .populate({
                path: "studentId",
                populate: {
                    path: "userId",
                    select: "name email",
                },
            });

        if (!cert) {
            return res.json({ valid: false });
        }

        res.json({
            valid: true,
            student: cert.studentId?.userId?.name,
            course: cert.courseId?.title,
            date: cert.issuedAt,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/courses", getPublicCourses);
router.get("/courses/:id", getPublicCourseById);
router.get("/live-classes", getLiveClasses);
router.get("/blogs", getPublicBlogs);
router.get("/blogs/:id", getPublicBlogById);
router.get("/testimonials", getPublicTestimonials);


module.exports = router;