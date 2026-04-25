const User = require("../models/User");
const bcrypt = require("bcryptjs");

const seedAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({
            email: "admin@gmail.com",
        });

        if (existingAdmin) {
            console.log("✅ Admin already exists");
            return;
        }

        const hashedPassword = await bcrypt.hash("123456", 10);

        const admin = new User({
            name: "Admin",
            email: "admin@gmail.com",
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