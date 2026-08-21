const CourseReview = require("../models/CourseReview");
const Course = require("../models/Course");

exports.submitCourseReview = async (req, res) => {
    try {
        const { courseId, rating, review } = req.body;

        const studentId = req.user.id;

        if (!courseId) {
            return res.status(400).json({
                message: "Course is required.",
            });
        }

        const numericRating = Number(rating);

        if (
            !numericRating ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5.",
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found.",
            });
        }

        const existingReview = await CourseReview.findOne({
            course: courseId,
            student: studentId,
        });

        let courseReview;

        if (existingReview) {
            existingReview.rating = numericRating;
            existingReview.review = review?.trim() || "";

            await existingReview.save();

            courseReview = existingReview;
        } else {
            courseReview = await CourseReview.create({
                course: courseId,
                student: studentId,
                rating: numericRating,
                review: review?.trim() || "",
            });
        }

        const ratingData = await CourseReview.aggregate([
            {
                $match: {
                    course: course._id,
                },
            },
            {
                $group: {
                    _id: "$course",
                    averageRating: {
                        $avg: "$rating",
                    },
                    totalReviews: {
                        $sum: 1,
                    },
                },
            },
        ]);

        const ratingSummary = ratingData[0];

        course.averageRating = Number(
            ratingSummary.averageRating.toFixed(1)
        );

        course.totalReviews = ratingSummary.totalReviews;

        await course.save();

        res.status(existingReview ? 200 : 201).json({
            message: existingReview
                ? "Review updated successfully."
                : "Review submitted successfully.",

            review: courseReview,

            rating: {
                averageRating: course.averageRating,
                totalReviews: course.totalReviews,
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

exports.getCourseReviews = async (req, res) => {
    try {
        const { courseId } = req.params;

        const reviews = await CourseReview.find({
            course: courseId,
        })
            .populate({
                path: "student",
                select: "name avatar",
            })
            .sort({
                createdAt: -1,
            });

        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

exports.getMyCourseReview = async (req, res) => {
    try {
        const { courseId } = req.params;

        const review = await CourseReview.findOne({
            course: courseId,
            student: req.user.id,
        });

        res.status(200).json(review);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

exports.getCourseRatingSummary = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId).select(
            "averageRating totalReviews"
        );

        if (!course) {
            return res.status(404).json({
                message: "Course not found.",
            });
        }

        res.status(200).json({
            averageRating: course.averageRating || 0,
            totalReviews: course.totalReviews || 0,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};