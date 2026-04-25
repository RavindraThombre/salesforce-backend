const Testimonial = require("../models/Testimonial");

// ✅ GET ALL (PUBLIC)
exports.getTestimonials = async (req, res) => {
    try {
        const data = await Testimonial.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ CREATE (ADMIN)
exports.createTestimonial = async (req, res) => {
    try {
        const { name, review, rating } = req.body;

        if (!name || !review) {
            return res.status(400).json({ message: "All fields required" });
        }

        const testimonial = await Testimonial.create({
            name,
            review,
            rating,
        });

        res.status(201).json(testimonial);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ DELETE (ADMIN)
exports.deleteTestimonial = async (req, res) => {
    try {
        await Testimonial.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};