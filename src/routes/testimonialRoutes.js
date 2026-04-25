const express = require("express");
const router = express.Router();

const {
    getTestimonials,
    createTestimonial,
    deleteTestimonial,
} = require("../controllers/testimonialController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// PUBLIC
router.get("/", getTestimonials);

// ADMIN
router.post("/", verifyToken, isAdmin, createTestimonial);
router.delete("/:id", verifyToken, isAdmin, deleteTestimonial);

module.exports = router;