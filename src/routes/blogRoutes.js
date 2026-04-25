// routes/blogRoutes.js

const express = require("express");
const router = express.Router();

const {
    getBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
} = require("../controllers/blogController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// PUBLIC
router.get("/", getBlogs);
router.get("/:id", getBlogById);

// ADMIN
router.post("/", verifyToken, isAdmin, upload.single("image"), createBlog);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), updateBlog);
router.delete("/:id", verifyToken, isAdmin, deleteBlog);

module.exports = router;