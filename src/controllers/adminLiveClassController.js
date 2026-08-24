const Course = require("../models/Course");
const LiveClass = require("../models/LiveClass");
const { createZoomMeeting } = require("../services/zoomService");

// Add your existing imports
// const Student = require("../models/Student");
// const { sendEmail } = require("../services/emailService");

const buildLiveClassDateTime = ({
    date,
    time,
    durationMinutes,
}) => {
    const [year, month, day] = date
        .split("-")
        .map(Number);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        throw new Error("Invalid class date");
    }

    const [hours, minutes] = time
        .split(":")
        .map(Number);

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        throw new Error("Invalid class time");
    }

    const duration = Number(durationMinutes);

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        throw new Error("Valid class duration is required");
    }

    const IST_OFFSET_MS =
        (5 * 60 + 30) * 60 * 1000;

    const startTime = new Date(
        Date.UTC(
            year,
            month - 1,
            day,
            hours,
            minutes,
            0,
            0,
        ) - IST_OFFSET_MS,
    );

    const endTime = new Date(
        startTime.getTime() +
        duration * 60 * 1000,
    );

    return {
        year,
        month,
        day,
        duration,
        startTime,
        endTime,
    };
};

exports.getLiveClasses = async (req, res) => {
    try {
        const classes = await LiveClass.find()
            .populate("courseId", "title")
            .populate("trainerId", "name")
            .sort({ startTime: 1 });

        res.set("Cache-Control", "no-store");

        res.json(classes);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};

exports.createLiveClass = async (req, res) => {
    try {
        const {
            courseId,
            trainerId,
            topic,
            date,
            time,
            durationMinutes,
            zoomLink,
            isFree,
        } = req.body;

        // ==============================
        // REQUIRED FIELDS
        // ==============================

        if (
            !courseId ||
            !trainerId ||
            !topic?.trim() ||
            !date ||
            !time ||
            !durationMinutes
        ) {
            return res.status(400).json({
                message: "All required fields must be provided",
            });
        }

        // ==============================
        // CHECK COURSE
        // ==============================

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // console.log("LIVE CLASS COURSE DEBUG:", {
        //     courseId,
        //     totalLiveSessions: course.totalLiveSessions,
        //     courseData: course.toObject(),
        // });

        const totalLiveSessions = Number(
            course.totalLiveSessions ?? 0,
        );

        if (totalLiveSessions <= 0) {
            return res.status(400).json({
                message: "This course does not allow live sessions",
            });
        }

        // ==============================
        // CHECK LIVE SESSION LIMIT
        // ==============================

        const existingLiveClasses =
            await LiveClass.countDocuments({
                courseId,
            });

        if (existingLiveClasses >= totalLiveSessions) {
            return res.status(400).json({
                message: `Live session limit reached. This course allows only ${totalLiveSessions} live session${totalLiveSessions === 1 ? "" : "s"
                    }.`,
            });
        }

        // ==============================
        // VALIDATE DURATION
        // ==============================

        const duration = Number(durationMinutes);

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            return res.status(400).json({
                message: "Valid class duration is required",
            });
        }

        // ==============================
        // VALIDATE DATE
        // ==============================

        const [year, month, day] = date
            .split("-")
            .map(Number);

        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day)
        ) {
            return res.status(400).json({
                message: "Invalid class date",
            });
        }

        // ==============================
        // VALIDATE TIME
        // ==============================

        const [hours, minutes] = time
            .split(":")
            .map(Number);

        if (
            !Number.isInteger(hours) ||
            !Number.isInteger(minutes) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return res.status(400).json({
                message: "Invalid class time",
            });
        }

        // ==============================
        // CREATE IST START TIME
        // ==============================

        const IST_OFFSET_MS =
            (5 * 60 + 30) * 60 * 1000;

        const startTime = new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                hours,
                minutes,
                0,
                0,
            ) - IST_OFFSET_MS,
        );

        const endTime = new Date(
            startTime.getTime() +
            duration * 60 * 1000,
        );

        // ==============================
        // CREATE ZOOM MEETING
        // ==============================

        let finalZoomLink = zoomLink;

        if (!finalZoomLink) {
            try {
                finalZoomLink =
                    await createZoomMeeting({
                        topic: topic.trim(),
                        date,
                        time,
                    });
            } catch (err) {
                console.error(
                    "Zoom creation failed:",
                    err,
                );

                return res.status(500).json({
                    message:
                        "Failed to create Zoom meeting",
                });
            }
        }

        // ==============================
        // CREATE LIVE CLASS
        // ==============================

        const newClass =
            await LiveClass.create({
                courseId,
                trainerId,
                topic: topic.trim(),
                date: new Date(
                    Date.UTC(
                        year,
                        month - 1,
                        day,
                        0,
                        0,
                        0,
                    ),
                ),
                time,
                startTime,
                endTime,
                durationMinutes: duration,
                timezone: "Asia/Kolkata",
                zoomLink: finalZoomLink,
                isFree: Boolean(isFree),
            });

        return res.status(201).json({
            message: "Live class scheduled successfully",
            data: newClass,
        });
    } catch (err) {
        console.error(
            "Create live class error:",
            err,
        );

        return res.status(500).json({
            message:
                err.message ||
                "Failed to create live class",
        });
    }
};

exports.updateLiveClass = async (req, res) => {
    try {
        const {
            courseId,
            trainerId,
            topic,
            date,
            time,
            durationMinutes,
            zoomLink,
            isFree,
        } = req.body;

        const liveClass = await LiveClass.findById(
            req.params.id,
        );

        if (!liveClass) {
            return res.status(404).json({
                message: "Live class not found",
            });
        }

        // DO NOT ALLOW EDIT AFTER CLASS STARTED
        const now = new Date();

        if (now >= liveClass.startTime) {
            return res.status(400).json({
                message:
                    "This live class has already started or ended and cannot be edited",
            });
        }

        // REQUIRED FIELDS
        if (
            !courseId ||
            !trainerId ||
            !topic?.trim() ||
            !date ||
            !time ||
            !durationMinutes
        ) {
            return res.status(400).json({
                message: "All required fields must be provided",
            });
        }

        // CHECK COURSE
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const totalLiveSessions = Number(
            course.totalLiveSessions ?? 0,
        );

        if (totalLiveSessions <= 0) {
            return res.status(400).json({
                message:
                    "This course does not allow live sessions",
            });
        }

        // CHECK LIVE SESSION LIMIT
        // Exclude current live class
        const existingLiveClasses =
            await LiveClass.countDocuments({
                courseId,
                _id: {
                    $ne: liveClass._id,
                },
            });

        if (
            existingLiveClasses >= totalLiveSessions
        ) {
            return res.status(400).json({
                message:
                    `Live session limit reached. This course allows only ${totalLiveSessions} live session${totalLiveSessions === 1 ? "" : "s"
                    }.`,
            });
        }

        // BUILD DATE / TIME
        let dateTime;
        try {
            dateTime = buildLiveClassDateTime({
                date,
                time,
                durationMinutes,
            });
        } catch (error) {
            return res.status(400).json({
                message: error.message,
            });
        }

        const {
            year,
            month,
            day,
            duration,
            startTime,
            endTime,
        } = dateTime;

        // DO NOT MOVE CLASS INTO THE PAST
        if (startTime <= now) {
            return res.status(400).json({
                message:
                    "Live class must be scheduled for a future date and time",
            });
        }

        // UPDATE LIVE CLASS
        liveClass.courseId = courseId;
        liveClass.trainerId = trainerId;
        liveClass.topic = topic.trim();

        liveClass.date = new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                0,
                0,
                0,
            ),
        );

        liveClass.time = time;
        liveClass.startTime = startTime;
        liveClass.endTime = endTime;
        liveClass.durationMinutes = duration;
        liveClass.isFree = Boolean(isFree);

        // ZOOM LINK
        // DO NOT CREATE A NEW ZOOM MEETING
        if (zoomLink?.trim()) {
            liveClass.zoomLink = zoomLink.trim();
        }

        // If zoomLink is empty:
        // Existing liveClass.zoomLink remains unchanged.
        await liveClass.save();

        return res.status(200).json({
            message: "Live class updated successfully",
            data: liveClass,
        });

    } catch (err) {
        console.error(
            "Update live class error:",
            err,
        );

        return res.status(500).json({
            message:
                err.message ||
                "Failed to update live class",
        });
    }
};

exports.deleteLiveClass = async (
    req,
    res
) => {
    try {
        await LiveClass.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Class deleted",
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
};