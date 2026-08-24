// controllers/courseController.js

const Course = require("../models/Course");
const LiveClass = require("../models/LiveClass");
const cloudinary = require("../config/cloudinary");

// GET ALL COURSES (NO CHANGE)
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch courses" });
    }
};

// GET SINGLE COURSE (NO CHANGE)
exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json(course);
    } catch (error) {
        res.status(500).json({ message: "Error fetching course" });
    }
};


exports.createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            discountPrice,
            isFree,
            totalLiveSessions,
            level,
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({
                message: "Course title is required",
            });
        }

        if (!description?.trim()) {
            return res.status(400).json({
                message: "Course description is required",
            });
        }

        const allowedLevels = [
            "Beginner",
            "Intermediate",
            "Advanced",
        ];

        if (!allowedLevels.includes(level)) {
            return res.status(400).json({
                message:
                    "Level must be Beginner, Intermediate, or Advanced",
            });
        }

        // =====================================
        // TOTAL LIVE SESSIONS VALIDATION
        // =====================================

        const liveSessionCount =
            Number(totalLiveSessions);

        if (
            !Number.isInteger(liveSessionCount) ||
            liveSessionCount < 1
        ) {
            return res.status(400).json({
                message:
                    "Total live sessions must be at least 1",
            });
        }

        // =====================================
        // FREE / PAID
        // =====================================

        const isFreeCourse =
            isFree === "true" || isFree === true;

        const coursePrice = Number(price) || 0;

        const courseDiscountPrice =
            Number(discountPrice) || 0;

        // =====================================
        // PAID COURSE VALIDATION
        // =====================================

        if (!isFreeCourse) {
            if (coursePrice <= 0) {
                return res.status(400).json({
                    message:
                        "Price must be greater than 0",
                });
            }

            if (
                courseDiscountPrice > coursePrice
            ) {
                return res.status(400).json({
                    message:
                        "Discount price cannot be greater than original price",
                });
            }
        }

        // =====================================
        // THUMBNAIL
        // =====================================

        const thumbnail = req.file?.path || "";

        const thumbnailPublicId =
            req.file?.filename || "";

        // =====================================
        // CREATE COURSE
        // =====================================

        const course = new Course({
            title: title.trim(),
            description: description.trim(),
            isFree: isFreeCourse,
            price: isFreeCourse
                ? 0
                : coursePrice,

            discountPrice: isFreeCourse
                ? 0
                : courseDiscountPrice,

            totalLiveSessions: liveSessionCount,
            level,
            thumbnail,
            thumbnailPublicId,

        });

        await course.save();

        return res.status(201).json({
            success: true,
            message:
                "Course created successfully",
            course,
        });

    } catch (error) {
        console.error(
            "Create course error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Course creation failed",
        });
    }
};

// UPDATE COURSE
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const {
            title,
            description,
            price,
            discountPrice,
            isFree,
            totalLiveSessions,
            level,
        } = req.body;

        // BASIC VALIDATION


        const allowedLevels = [
            "Beginner",
            "Intermediate",
            "Advanced",
        ];

        if (
            level !== undefined &&
            !allowedLevels.includes(level)
        ) {
            return res.status(400).json({
                message:
                    "Level must be Beginner, Intermediate, or Advanced",
            });
        }


        if (title !== undefined && !title.trim()) {
            return res.status(400).json({
                message: "Course title is required",
            });
        }

        if (
            description !== undefined &&
            !description.trim()
        ) {
            return res.status(400).json({
                message: "Course description is required",
            });
        }

        // TOTAL LIVE SESSIONS VALIDATION
        if (totalLiveSessions !== undefined) {
            const newTotalLiveSessions = Number(totalLiveSessions);

            if (
                !Number.isInteger(newTotalLiveSessions) ||
                newTotalLiveSessions < 1
            ) {
                return res.status(400).json({
                    message: "Total live sessions must be at least 1",
                });
            }

            // Count existing live sessions for this course
            const existingLiveSessions = await LiveClass.countDocuments({
                courseId: course._id,
            });

            // Cannot reduce below existing sessions
            if (newTotalLiveSessions < existingLiveSessions) {
                return res.status(400).json({
                    message: `Cannot set total live sessions to ${newTotalLiveSessions}. ${existingLiveSessions} live sessions already exist for this course.`,
                });
            }

            course.totalLiveSessions = newTotalLiveSessions;
        }

        // FREE / PAID COURSE
        const isFreeCourse =
            isFree !== undefined
                ? isFree === "true" || isFree === true
                : course.isFree;

        const coursePrice =
            price !== undefined
                ? Number(price)
                : course.price;

        const courseDiscountPrice =
            discountPrice !== undefined
                ? Number(discountPrice)
                : course.discountPrice;

        // Validate numbers
        if (
            !Number.isFinite(coursePrice) ||
            coursePrice < 0
        ) {
            return res.status(400).json({
                message: "Invalid course price",
            });
        }

        if (
            !Number.isFinite(courseDiscountPrice) ||
            courseDiscountPrice < 0
        ) {
            return res.status(400).json({
                message: "Invalid discount price",
            });
        }

        // Paid course validation
        if (!isFreeCourse) {
            if (coursePrice <= 0) {
                return res.status(400).json({
                    message:
                        "Price must be greater than 0",
                });
            }

            if (
                courseDiscountPrice >
                coursePrice
            ) {
                return res.status(400).json({
                    message:
                        "Discount price cannot be greater than original price",
                });
            }
        }

        // UPDATE BASIC FIELDS
        if (title !== undefined) {
            course.title = title.trim();
        }

        if (description !== undefined) {
            course.description =
                description.trim();
        }

        if (level !== undefined) {
            course.level = level;
        }

        course.isFree = isFreeCourse;
        // Free course must always have 0 price
        course.price = isFreeCourse
            ? 0
            : coursePrice;

        course.discountPrice = isFreeCourse
            ? 0
            : courseDiscountPrice;

        // UPDATE THUMBNAIL
        if (req.file) {
            if (course.thumbnailPublicId) {
                await cloudinary.uploader.destroy(
                    course.thumbnailPublicId
                );
            }

            course.thumbnail = req.file.path;

            course.thumbnailPublicId =
                req.file.filename;
        }
        await course.save();
        return res.json({
            success: true,
            message: "Course updated successfully",
            course,
        });

    } catch (err) {
        console.error(
            "Update course error:",
            err
        );

        return res.status(500).json({
            message:
                err.message ||
                "Failed to update course",
        });
    }
};

// DELETE COURSE
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(
            req.params.id
        );

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Delete thumbnail from Cloudinary
        if (course.thumbnailPublicId) {
            await cloudinary.uploader.destroy(
                course.thumbnailPublicId
            );
        }

        await course.deleteOne();

        return res.json({
            success: true,
            message: "Deleted successfully",
        });

    } catch (err) {
        console.error(
            "Delete course error:",
            err
        );

        return res.status(500).json({
            message:
                err.message ||
                "Failed to delete course",
        });
    }
};