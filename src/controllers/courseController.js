// controllers/courseController.js

const Course = require("../models/Course");
const cloudinary = require("../config/cloudinary");

// ✅ GET ALL COURSES (NO CHANGE)
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch courses" });
    }
};

// ✅ GET SINGLE COURSE (NO CHANGE)
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

// ✅ CREATE COURSE (UPDATED - SAFE)
exports.createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            discountPrice,
            isFree,
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

        // FormData sends boolean as string: "true" / "false"
        const isFreeCourse = isFree === "true" || isFree === true;

        const coursePrice = Number(price) || 0;
        const courseDiscountPrice = Number(discountPrice) || 0;

        // Validate paid course
        if (!isFreeCourse) {
            if (coursePrice <= 0) {
                return res.status(400).json({
                    message: "Price must be greater than 0",
                });
            }

            // Discount cannot be greater than original price
            if (courseDiscountPrice > coursePrice) {
                return res.status(400).json({
                    message: "Discount price cannot be greater than original price",
                });
            }
        }

        const thumbnail = req.file?.path || "";
        const thumbnailPublicId = req.file?.filename || "";

        const course = new Course({
            title: title.trim(),
            description: description.trim(),

            // Use converted boolean here
            isFree: isFreeCourse,

            // Free = 0, Paid = submitted values
            price: isFreeCourse ? 0 : coursePrice,
            discountPrice: isFreeCourse ? 0 : courseDiscountPrice,

            thumbnail,
            thumbnailPublicId,
        });

        await course.save();

        res.status(201).json(course);
    } catch (error) {
        console.error("Create course error:", error);

        res.status(500).json({
            message: "Course creation failed",
        });
    }
};

// ✅ UPDATE COURSE (UPDATED - SAFE)
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        Object.assign(course, req.body);

        if (req.file) {

            if (course.thumbnailPublicId) {
                await cloudinary.uploader.destroy(course.thumbnailPublicId);
            }

            course.thumbnail = req.file.path;
            course.thumbnailPublicId = req.file.filename;
        }

        await course.save();

        res.json(course);

    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

// ✅ DELETE COURSE (NO CHANGE)
exports.deleteCourse = async (req, res) => {

    const course = await Course.findById(req.params.id);

    if (!course) {
        return res.status(404).json({
            message: "Course not found",
        });
    }

    if (course.thumbnailPublicId) {
        await cloudinary.uploader.destroy(course.thumbnailPublicId);
    }

    await course.deleteOne();

    res.json({
        message: "Deleted successfully",
    });

};