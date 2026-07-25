const Blog = require("../models/Blog");
const Course = require("../models/Course");
const LiveClass = require("../models/LiveClass");
const Testimonial = require("../models/Testimonial");

// ✅ GET ALL COURSES
exports.getPublicCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });

        const result = courses.map((c) => ({
            _id: c._id,
            title: c.title,
            description: c.description,
            price: c.discountPrice || c.price,
            originalPrice: c.discountPrice ? c.price : null,
            level: c.level,
            image: c.thumbnail,
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET PUBLIC LIVE CLASSES
exports.getLiveClasses = async (req, res) => {
    try {
        const now = new Date();
        const classes = await LiveClass.find({
            endTime: {
                $gte: now,
            },
        })
            .populate(
                "courseId",
                "title level price discountPrice"
            )
            .populate(
                "trainerId",
                "name email"
            )
            .sort({
                startTime: 1,
            });

        const result = classes.map((c) => {
            const price =
                c.courseId?.discountPrice ??
                c.courseId?.price ??
                0;

            const isCourseFree =
                price === 0;

            const startTime =
                new Date(c.startTime);

            const endTime =
                new Date(c.endTime);

            const isLive =
                now >= startTime &&
                now < endTime;

            const isUpcoming =
                now < startTime;

            return {
                _id: c._id,
                course: c.courseId?.title,
                level: c.courseId?.level,
                courseId: c.courseId?._id,
                trainer: c.trainerId?.name,
                topic: c.topic,
                date: c.date,
                time: c.time,
                startTime: c.startTime,
                endTime: c.endTime,
                durationMinutes: c.durationMinutes,
                timezone: c.timezone || "Asia/Kolkata",
                zoomLink: c.zoomLink,
                isFree: c.isFree || isCourseFree,
                price,
                isLive,
                isUpcoming,
            };
        });
        res.set(
            "Cache-Control",
            "no-store"
        );
        res.json(result);
    } catch (err) {
        console.error(
            "Get public live classes error:",
            err
        );
        res.status(500).json({
            message: err.message,
        });
    }
};

// ✅ GET SINGLE COURSE
exports.getPublicCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json({
            ...course.toObject(),

            price: course.discountPrice || course.price,
            originalPrice: course.discountPrice ? course.price : null,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


/* ---------------- ALL BLOGS ---------------- */
exports.getPublicBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .select("title description image createdAt");

        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ---------------- BLOG DETAIL ---------------- */
exports.getPublicBlogById = async (req, res) => {
    try {
        const blog = await Blog.findOne({
            _id: req.params.id,
            isPublished: true,
        });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


/* ---------------- TESTIMONIALS ---------------- */
exports.getPublicTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .limit(6); // ✅ optional (best for homepage)

        res.json(testimonials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


