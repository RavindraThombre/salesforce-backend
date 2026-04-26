require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// const seedAdmin = require("./config/seedAdmin");

const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB();
// connectDB().then(() => {
//     seedAdmin(); // ✅ runs once safely
// });
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const courseRoutes = require("./routes/courseRoutes");
const adminStudentRoutes = require("./routes/adminStudentRoutes");
const adminPaymentRoutes = require("./routes/adminPaymentRoutes");
const adminLiveClassRoutes = require("./routes/adminLiveClassRoutes");
const blogRoutes = require("./routes/blogRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const publicRoutes = require("./routes/publicRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const trainerRoutes = require("./routes/trainerRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.get("/", (req, res) => {
    res.send("LMS API Running 🚀");
});

app.use("/api/sf/v1/auth", authRoutes);
app.use("/api/sf/v1/dashboard", dashboardRoutes);
app.use("/api/sf/v1/user", userRoutes);
app.use("/api/sf/v1/student", studentRoutes);
app.use("/api/sf/v1/notifications", notificationRoutes);
app.use("/api/sf/v1/courses", courseRoutes);
app.use("/api/sf/v1/admin/students", adminStudentRoutes);
app.use("/api/sf/v1/admin/payments", adminPaymentRoutes);
app.use("/api/sf/v1/admin/live-classes", adminLiveClassRoutes);
app.use("/api/sf/v1/blogs", blogRoutes);
app.use("/api/sf/v1/testimonials", testimonialRoutes);
app.use("/api/sf/v1/settings", settingsRoutes);
app.use("/api/sf/v1/public", publicRoutes);
app.use("/api/sf/v1/payments", paymentRoutes);
app.use("/api/sf/v1/trainers", trainerRoutes);
app.use("/api/sf/v1/contacts", contactRoutes);



require("./services/reminderJob");
// start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});