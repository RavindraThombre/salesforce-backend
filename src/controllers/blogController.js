// controllers/blogController.js
const fs = require("fs");
const path = require("path");
const Blog = require("../models/Blog");

// ✅ GET ALL
exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.set("Cache-Control", "no-store");
        res.json(blogs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ GET ONE
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        res.json(blog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ CREATE
exports.createBlog = async (req, res) => {
    try {
        const { title, content, description } = req.body;

        if (!title || !content || !description) {
            return res.status(400).json({
                message: "All fields required",
            });
        }

        const blog = await Blog.create({
            title,
            content,
            description, // ✅ manual
            image: req.file ? `/uploads/${req.file.filename}` : "",
            isPublished: true,
        });

        res.status(201).json(blog);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // 🔥 DELETE OLD IMAGE
        if (req.file && blog.image) {
            const oldImagePath = path.join(__dirname, "..", blog.image);

            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // 🔥 UPDATE FIELDS (MANUAL ONLY)
        if (req.body.title) blog.title = req.body.title;

        if (req.body.description) {
            blog.description = req.body.description; // ✅ manual
        }

        if (req.body.content) {
            blog.content = req.body.content; // ✅ no auto logic
        }

        // 🔥 UPDATE IMAGE
        if (req.file) {
            blog.image = `/uploads/${req.file.filename}`;
        }

        await blog.save();

        res.json(blog);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// ✅ DELETE
exports.deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};