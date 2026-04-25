const Setting = require("../models/Setting");

// ✅ GET ALL SETTINGS
exports.getSettings = async (req, res) => {
    try {
        const settings = await Setting.find();

        const formatted = {};
        settings.forEach((s) => {
            formatted[s.key] = s.value;
        });

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ UPDATE SETTINGS
exports.updateSettings = async (req, res) => {
    try {
        const updates = req.body;

        for (const key in updates) {
            await Setting.findOneAndUpdate(
                { key },
                { value: updates[key] },
                { upsert: true }
            );
        }

        res.json({ message: "Settings saved ✅" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};