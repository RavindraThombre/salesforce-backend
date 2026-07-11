// controllers/blogController.js
const cloudinary = require("../config/cloudinary");
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
            description,
            image: req.file ? req.file.path : "",
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
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        if (req.body.title) {
            blog.title = req.body.title;
        }

        if (req.body.description) {
            blog.description = req.body.description;
        }

        if (req.body.content) {
            blog.content = req.body.content;
        }

        // Upload new image
        if (req.file) {

            // Delete old Cloudinary image
            if (blog.image) {
                const publicId = blog.image
                    .split("/")
                    .slice(-2)
                    .join("/")
                    .split(".")[0];

                await cloudinary.uploader.destroy(publicId);
            }

            blog.image = req.file.path;
        }

        await blog.save();

        res.json(blog);

    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

// ✅ DELETE
exports.deleteBlog = async (req, res) => {
    try {

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found",
            });
        }

        if (blog.image) {
            const publicId = blog.image
                .split("/")
                .slice(-2)
                .join("/")
                .split(".")[0];

            await cloudinary.uploader.destroy(publicId);
        }

        await Blog.findByIdAndDelete(req.params.id);

        res.json({
            message: "Deleted",
        });

    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};