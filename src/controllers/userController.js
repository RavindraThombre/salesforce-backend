const User = require("../models/User");
const bcrypt = require("bcryptjs");

// GET PROFILE
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, city } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                phone,
                city,
            },
            {
                new: true,
                runValidators: true,
            }
        )
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};


/* ================= CHANGE PASSWORD ================= */

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required.",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from the current password.",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long.",
            });
        }

        // Find user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect.",
            });
        }

        // Hash and save new password
        user.password = await bcrypt.hash(newPassword, 10);

        await user.save();

        return res.status(200).json({
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("Change Password Error:", error);

        return res.status(500).json({
            message: "Something went wrong. Please try again later.",
        });
    }
};
