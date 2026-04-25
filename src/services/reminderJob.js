const cron = require("node-cron");
const LiveClass = require("../models/LiveClass");
const Student = require("../models/Student");
const { sendEmail } = require("../services/emailService");

// run every 10 min
cron.schedule("*/10 * * * *", async () => {
    console.log("⏰ Checking reminders...");

    const now = new Date();
    const next30Min = new Date(now.getTime() + 30 * 60 * 1000);

    try {
        const classes = await LiveClass.find({
            date: { $gte: now, $lte: next30Min },
            reminderSent: false, // 🔥 important
        });

        for (const cls of classes) {
            const students = await Student.find({
                courses: cls.courseId,
            }).populate("userId");

            for (const s of students) {
                if (!s.userId?.email) continue;

                await sendEmail({
                    to: s.userId.email,
                    subject: `Reminder: ${cls.topic}`,
                    html: `
            <h3>Class Reminder</h3>
            <p>${cls.topic} starts in 30 minutes</p>
            <p><a href="${cls.zoomLink}">Join Class</a></p>
          `,
                });
            }

            // ✅ mark as sent (avoid duplicate emails)
            await LiveClass.findByIdAndUpdate(cls._id, {
                reminderSent: true,
            });
        }
    } catch (err) {
        console.error("Reminder error:", err);
    }
});