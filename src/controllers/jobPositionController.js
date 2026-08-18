const JobPosition = require("../models/JobPosition");
const slugify = require("slugify");

// Create Job Position
exports.createJobPosition = async (req, res) => {
    try {
        const {
            title,
            department,
            employmentType,
            location,
            experience,
            salary,
            openings,
            skills,
            description,
            responsibilities,
            requirements,
            benefits,
            status,
        } = req.body;

        const parsedExperience =
            typeof experience === "string"
                ? JSON.parse(experience)
                : experience;

        const parsedSalary =
            typeof salary === "string"
                ? JSON.parse(salary)
                : salary;

        let parsedSkills = skills;

        if (typeof skills === "string") {
            parsedSkills = JSON.parse(skills);
        }

        if (Array.isArray(parsedSkills) && parsedSkills.length === 1) {
            if (
                typeof parsedSkills[0] === "string" &&
                parsedSkills[0].startsWith("[")
            ) {
                parsedSkills = JSON.parse(parsedSkills[0]);
            }
        }

        const banner = req.file ? req.file.path : "";

        const slug = slugify(title, {
            lower: true,
            strict: true,
        });

        const existing = await JobPosition.findOne({ slug });

        if (existing) {
            return res.status(400).json({
                message: "Job position already exists.",
            });
        }

        const job = await JobPosition.create({
            title,
            slug,
            department,
            employmentType,
            location,

            experience: parsedExperience,
            salary: parsedSalary,
            skills: parsedSkills,

            openings,
            description,
            responsibilities,
            requirements,
            benefits,
            banner,
            status,
            publishedAt: status === "Published" ? new Date() : null,
        });

        res.status(201).json({
            message: "Job position created successfully.",
            job,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// Get All Job Positions
exports.getJobPositions = async (req, res) => {
    try {
        const jobs = await JobPosition.find().sort({
            createdAt: -1,
        });

        res.json(jobs);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// Get Single Job Position
exports.getJobPosition = async (req, res) => {
    try {
        const job = await JobPosition.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        res.json(job);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// Update Job Position
exports.updateJobPosition = async (req, res) => {
    try {
        const data = {
            ...req.body,
        };

        if (typeof data.experience === "string") {
            data.experience = JSON.parse(data.experience);
        }

        if (typeof data.salary === "string") {
            data.salary = JSON.parse(data.salary);
        }

        if (typeof data.skills === "string") {
            data.skills = JSON.parse(data.skills);
        }

        if (
            Array.isArray(data.skills) &&
            data.skills.length === 1 &&
            typeof data.skills[0] === "string" &&
            data.skills[0].startsWith("[")
        ) {
            data.skills = JSON.parse(data.skills[0]);
        }
        if (data.title) {
            data.slug = slugify(data.title, {
                lower: true,
                strict: true,
            });
        }

        // Update banner if a new file is uploaded
        if (req.file) {
            data.banner = req.file.path;
        }

        const job = await JobPosition.findByIdAndUpdate(
            req.params.id,
            data,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        res.json({
            message: "Job position updated successfully.",
            job,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// Delete Job Position
exports.deleteJobPosition = async (req, res) => {
    try {
        const job = await JobPosition.findByIdAndDelete(
            req.params.id
        );

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        res.json({
            message: "Job position deleted successfully.",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// Update Job Status
exports.updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const job = await JobPosition.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        job.status = status;

        if (status === "Published" && !job.publishedAt) {
            job.publishedAt = new Date();
        }

        await job.save();

        res.json({
            message: "Status updated successfully.",
            job,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};


// Public - Get Published Jobs
exports.getPublishedJobs = async (req, res) => {
    try {
        const jobs = await JobPosition.find({
            status: "Published",
        })
            .sort({ publishedAt: -1 })
            .select("-__v");

        res.json(jobs);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

// Public - Get Job By Slug
exports.getPublishedJobBySlug = async (req, res) => {
    try {
        const job = await JobPosition.findOne({
            slug: req.params.slug,
            status: "Published",
        });

        if (!job) {
            return res.status(404).json({
                message: "Job position not found.",
            });
        }

        res.json(job);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error.",
        });
    }
};