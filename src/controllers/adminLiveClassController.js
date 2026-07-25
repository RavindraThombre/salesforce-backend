const LiveClass = require("../models/LiveClass");
const { createZoomMeeting } = require("../services/zoomService");

// Add your existing imports
// const Student = require("../models/Student");
// const { sendEmail } = require("../services/emailService");

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

        // REQUIRED FIELDS
        if (
            !courseId ||
            !trainerId ||
            !topic ||
            !date ||
            !time ||
            !durationMinutes
        ) {
            return res.status(400).json({
                message: "All required fields must be provided",
            });
        }

        // VALIDATE DURATION
        const duration = Number(durationMinutes);

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            return res.status(400).json({
                message: "Valid class duration is required",
            });
        }

        const selectedDate = new Date(date);

        if (Number.isNaN(selectedDate.getTime())) {
            return res.status(400).json({
                message: "Invalid class date",
            });
        }

        const istDateParts =
            new Intl.DateTimeFormat("en-CA", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }).formatToParts(selectedDate);

        const getPart = (type) =>
            istDateParts.find(
                (part) => part.type === type
            )?.value;

        const year = getPart("year");
        const month = getPart("month");
        const day = getPart("day");

        const [hours, minutes] =
            time.split(":").map(Number);

        // VALIDATE TIME
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

        // IST = UTC +05:30
        const IST_OFFSET_MS =
            (5 * 60 + 30) * 60 * 1000;

        // CALCULATE START TIME
        const startTime = new Date(
            Date.UTC(
                Number(year),
                Number(month) - 1,
                Number(day),
                hours,
                minutes,
                0,
                0
            ) - IST_OFFSET_MS
        );

        // CALCULATE MANDATORY END TIME
        const endTime = new Date(
            startTime.getTime() +
            duration * 60 * 1000
        );

        // ZOOM
        let finalZoomLink = zoomLink;

        if (!finalZoomLink) {
            try {
                finalZoomLink =
                    await createZoomMeeting({
                        topic,
                        date,
                        time,
                    });
            } catch (err) {
                console.error(
                    "Zoom creation failed:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to create Zoom meeting",
                });
            }
        }

        // SAVE
        const newClass =
            await LiveClass.create({
                courseId,
                trainerId,
                topic,

                date,
                time,

                // Mandatory
                startTime,
                endTime,
                durationMinutes: duration,

                timezone: "Asia/Kolkata",
                zoomLink: finalZoomLink,
                isFree: Boolean(isFree),
            });

        // Keep your existing EMAIL code here

        res.status(201).json(newClass);
    } catch (err) {
        console.error(
            "Create live class error:",
            err
        );

        res.status(500).json({
            message: err.message,
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