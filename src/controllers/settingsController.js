const Setting = require("../models/Setting");

// ✅ GET ALL SETTINGS
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.find()
            .populate("updatedBy", "name email");

        const formatted = {};
        let lastUpdated = null;

        settings.forEach((item) => {
            formatted[item.key] = item.value;

            if (
                !lastUpdated ||
                item.updatedAt > lastUpdated.updatedAt
            ) {
                lastUpdated = item;
            }
        });

        res.json({
            settings: formatted,
            lastModified: lastUpdated
                ? {
                    updatedAt: lastUpdated.updatedAt,
                    updatedBy: lastUpdated.updatedBy,
                }
                : null,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

// ✅ UPDATE SETTINGS
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;

        for (const [key, value] of Object.entries(updates)) {
            await Setting.findOneAndUpdate(
                { key },
                {
                    value,
                    updatedBy: req.user._id,
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                }
            );
        }

        const settings = await Setting.find()
            .populate("updatedBy", "name email");

        const formatted = {};

        settings.forEach((item) => {
            formatted[item.key] = item.value;
        });

        res.json({
            message: "Settings updated successfully.",
            settings: formatted,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};