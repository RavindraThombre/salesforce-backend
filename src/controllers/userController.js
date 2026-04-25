const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET PROFILE
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, city } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, city },
            { new: true }
        ).select("-password");

        res.json({
            message: "Profile updated successfully",
            user,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



/* ================= CHANGE PASSWORD ================= */

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // ✅ validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different",
            });
        }

        // ✅ find user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        // ✅ check current password
        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        // ✅ hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;

        await user.save();

        res.json({
            message: "Password updated successfully",
        });

    } catch (err) {
        res.status(500).json({
            message: err.message || "Server error",
        });
    }
};
