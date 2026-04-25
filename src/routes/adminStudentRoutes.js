// routes/adminStudentRoutes.js

const express = require("express");
const router = express.Router();

const {
    getAllStudentsAdmin,
    getStudentDetailsAdmin,
} = require("../controllers/adminStudentController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ✅ ADMIN ONLY
router.get("/", verifyToken, isAdmin, getAllStudentsAdmin);
router.get("/:id", verifyToken, isAdmin, getStudentDetailsAdmin);

module.exports = router;