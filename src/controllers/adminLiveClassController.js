// controllers/adminLiveClassController.js

const LiveClass = require("../models/LiveClass");
const { createZoomMeeting } = require("../services/zoomService");

// ✅ GET ALL
exports.getLiveClasses = async (req, res) => {
    try {
        const classes = await LiveClass.find()
            .populate("courseId", "title")
            .populate("trainerId", "name")
            .sort({ date: 1 });

        res.set("Cache-Control", "no-store");
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ CREATE
// exports.createLiveClass = async (req, res) => {
//     try {
//         const { courseId, topic, date, time, zoomLink } = req.body;

//         const newClass = await LiveClass.create({
//             courseId,
//             topic,
//             date,
//             time,
//             zoomLink,
//         });

//         res.status(201).json(newClass);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };


// ✅ CREATE (WITH ZOOM AUTO LINK)
exports.createLiveClass = async (req, res) => {
    try {
        const { courseId, topic, date, time, zoomLink, trainerId, isFree } = req.body;

        if (!courseId || !topic || !date || !time || !trainerId) {
            return res.status(400).json({ message: "All fields required" });
        }

        let finalZoomLink = zoomLink;

        if (!zoomLink) {
            try {
                finalZoomLink = await createZoomMeeting({ topic, date, time });
            } catch (err) {
                console.error("Zoom creation failed:", err);
                return res.status(500).json({
                    message: "Failed to create Zoom meeting",
                });
            }
        }

        const newClass = await LiveClass.create({
            courseId,
            trainerId,
            topic,
            date,
            time,
            zoomLink: finalZoomLink,
            isFree: isFree || false,
        });

        // 🔥 EMAIL PART (ADD HERE)
        try {
            const students = await Student.find({
                courses: courseId,
            }).populate("userId");

            for (const s of students) {
                if (!s.userId?.email) continue;

                await sendEmail({
                    to: s.userId.email,
                    subject: `Live Class Scheduled: ${topic}`,
                    html: `
                        <h3>${topic}</h3>
                        <p>Your live class has been scheduled.</p>
                        <p><b>Date:</b> ${date}</p>
                        <p><b>Time:</b> ${time}</p>
                        <p><a href="${finalZoomLink}">Join Class</a></p>
                    `,
                });
            }
        } catch (emailErr) {
            console.error("Email error:", emailErr);
        }

        res.status(201).json(newClass);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ DELETE
exports.deleteLiveClass = async (req, res) => {
    try {
        await LiveClass.findByIdAndDelete(req.params.id);
        res.json({ message: "Class deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};