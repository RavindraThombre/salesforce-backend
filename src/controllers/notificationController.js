const Notification = require("../models/Notification");

/* ---------------- GET ---------------- */
exports.getNotifications = async (req, res) => {
    console.log("TOKEN USER 👉", req.user);
    console.log("USER ID 👉", req.user?.id);
    try {
        const notifications = await Notification.find({
            userId: req.user.id,
        }).sort({ createdAt: -1 });

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ---------------- MARK ONE ---------------- */
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, {
            isRead: true,
        });

        res.json({ message: "Marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* ---------------- MARK ALL ---------------- */
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id },
            { isRead: true }
        );

        res.json({ message: "All marked as read" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};