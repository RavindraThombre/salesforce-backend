const LiveClass = require("../models/LiveClass");
const User = require("../models/User");
const Course = require("../models/Course");
const bcrypt = require("bcryptjs");

// ✅ CREATE TRAINER
exports.createTrainer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Trainer already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const trainer = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "trainer",
        });

        // ✅ REMOVE PASSWORD FROM RESPONSE
        const { password: _, ...trainerData } = trainer._doc;

        res.status(201).json(trainerData);
    } catch (error) {
        console.error("CREATE TRAINER ERROR:", error);
        res.status(500).json({ message: error.message });
    }
};


// ### ✅ GET TRAINER CLASSES
exports.getTrainerClasses = async (req, res) => {
    try {
        const classes = await LiveClass.find({
            trainerId: req.user.id,
        })
            .populate("courseId", "title")
            .sort({ date: -1 });

        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ### ✅ GET TRAINER COURSES
exports.getTrainerCourses = async (req, res) => {
    try {
        const courses = await Course.find({
            trainerId: req.user.id,
        });

        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ### ✅ GET ALL TRAINERS(ADMIN PAGE)
exports.getTrainers = async (req, res) => {
    try {
        const trainers = await User.find({ role: "trainer" }).select("-password");

        res.json(trainers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ### ✅ DELETE TRAINER (ADMIN PAGE)
exports.deleteTrainer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Trainer deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getTrainerProfile = async (req, res) => {
    try {
        const trainer = await User.findById(req.user.id).select("-password");
        res.json(trainer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};




exports.updateTrainerProfile = async (req, res) => {
    try {
        const { name, bio, expertise } = req.body;

        const updateData = {
            name,
            bio,
            expertise,
        };

        // ✅ image upload
        if (req.file) {
            updateData.avatar = `/uploads/${req.file.filename}`;
        }

        const updated = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true }
        ).select("-password");

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.changeTrainerPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "All fields required" });
        }

        const user = await User.findById(req.user.id);

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        user.password = hashed;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};