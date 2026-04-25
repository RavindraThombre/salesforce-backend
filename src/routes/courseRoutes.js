// routes/courseRoutes.js

const express = require("express");
const router = express.Router();

const {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
} = require("../controllers/courseController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

// ✅ PUBLIC
router.get("/", getCourses);
router.get("/:id", getCourseById);

// ✅ ADMIN (UPDATED ONLY THESE TWO LINES)
router.post(
    "/",
    verifyToken,
    isAdmin,
    upload.single("thumbnail"),
    createCourse
);

router.put(
    "/:id",
    verifyToken,
    isAdmin,
    upload.single("thumbnail"),
    updateCourse
);

router.delete("/:id", verifyToken, isAdmin, deleteCourse);

module.exports = router;