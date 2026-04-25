// controllers/courseController.js

const Course = require("../models/Course");

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
        const { title, description, price, discountPrice, isFree } = req.body;

        if (!title) {
            return res.status(400).json({
                message: "Title and price are required",
            });
        }

        const thumbnail = req.file
            ? `/uploads/${req.file.filename}`
            : "";

        const course = new Course({
            title,
            description,
            price: isFree ? 0 : price,
            discountPrice: isFree ? 0 : discountPrice,
            // isFree: isFree === "true" ? true : false,
            isFree: isFree === "true" || isFree === true,
            thumbnail,
        });

        await course.save();

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: "Course creation failed" });
    }
};

// ✅ UPDATE COURSE (UPDATED - SAFE)
exports.updateCourse = async (req, res) => {
    try {
        const updateData = {
            ...req.body,
        };

        // ✅ NEW: update thumbnail only if new file uploaded
        if (req.file) {
            updateData.thumbnail = `/uploads/${req.file.filename}`;
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ message: "Course update failed" });
    }
};

// ✅ DELETE COURSE (NO CHANGE)
exports.deleteCourse = async (req, res) => {
    try {
        const deleted = await Course.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Course deletion failed" });
    }
};