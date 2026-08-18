const User = require("../models/User");
const JobApplication = require("../models/JobApplication");
const JobPosition = require("../models/JobPosition");
const { APPLICATION_STATUS_LIST } = require("../constants/applicationStatus");

exports.applyForJob = async (req, res) => {
    try {
        const { jobId, coverLetter, phone } = req.body;

        const applicantId = req.user.id;

        const job = await JobPosition.findById(jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        if (job.status !== "Published") {
            return res.status(400).json({
                message: "This job is no longer accepting applications.",
            });
        }

        const existing = await JobApplication.findOne({
            job: jobId,
            applicant: applicantId,
        });

        if (existing) {
            return res.status(400).json({
                message: "You have already applied for this job.",
            });
        }

        const user = await User.findById(applicantId);

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Resume is required.",
            });
        }

        const applicantPhone = user.phone?.trim() || phone?.trim();

        if (!applicantPhone) {
            return res.status(400).json({
                message: "Phone number is required.",
            });
        }

        // Save phone to profile only if it's missing
        if (!user.phone && phone?.trim()) {
            user.phone = phone.trim();
            await user.save();
        }

        const application = await JobApplication.create({
            job: jobId,
            applicant: applicantId,

            fullName: user.name,
            email: user.email,
            phone: applicantPhone,

            resume: {
                url: req.file.path,
                fileName: req.file.originalname,
            },

            coverLetter: coverLetter?.trim() || "",
        });

        res.status(201).json({
            message: "Application submitted successfully.",
            application,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};


exports.getMyApplications = async (req, res) => {
    try {
        const applications = await JobApplication.find({
            applicant: req.user.id,
        })
            .populate({
                path: "job",
                select: `
                    title
                    slug
                    banner
                    department
                    employmentType
                    location
                    experience
                    salary
                    status
                `,
            })
            .sort({
                appliedAt: -1,
            });

        res.status(200).json(applications);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

exports.getJobApplicants = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await JobPosition.findById(jobId);

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        // const applications = await JobApplication.find({
        //     job: jobId,
        // })
        //     .sort({
        //         appliedAt: -1,
        //     })
        //     .select("-__v");

        const applications = await JobApplication.find({
            job: jobId,
        })
            .populate({
                path: "applicant",
                select: "name email phone profileImage",
            })
            .sort({
                appliedAt: -1,
            });

        res.status(200).json(applications);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};


exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!APPLICATION_STATUS_LIST.includes(status)) {
            return res.status(400).json({
                message: "Invalid application status.",
            });
        }

        const application = await JobApplication.findById(id);

        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
            });
        }

        application.status = status;

        await application.save();

        res.status(200).json({
            message: "Application status updated successfully.",
            application,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};


//Get All Applications (Admin)
exports.getAllApplications = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            jobId,
            search,
        } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (jobId) {
            query.job = jobId;
        }

        if (search) {
            query.$or = [
                {
                    fullName: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    email: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    phone: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        const total = await JobApplication.countDocuments(query);

        const applications = await JobApplication.find(query)
            .populate({
                path: "job",
                select: "title slug department employmentType location",
            })
            .populate({
                path: "applicant",
                select: "name email phone",
            })
            .sort({
                appliedAt: -1,
            })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.status(200).json({
            data: applications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};