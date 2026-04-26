const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({
            email: "ravindrathombre66@gmail.com",
        });

        if (existingAdmin) {
            console.log("✅ Admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash("Ravindra@123$%^", 10);

        const admin = new User({
            name: "Ravindra Thombre",
            email: "ravindrathombre66@gmail.com",
            password: hashedPassword,
            role: "admin",
        });

        await admin.save();

        console.log("🔥 Admin created successfully");
    } catch (err) {
        console.error("❌ Error creating admin:", err.message);
    }
};

module.exports = seedAdmin;