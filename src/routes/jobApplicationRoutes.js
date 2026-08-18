const express = require("express");

const {
    applyForJob,
    getMyApplications,
    getJobApplicants,
    updateApplicationStatus,
    getAllApplications,
} = require("../controllers/jobApplicationController");
const { verifyToken } = require("../middleware/authMiddleware");
const createUploader = require("../middleware/upload");

const upload = createUploader(
    "resumes",
    ["pdf", "doc", "docx"],
    "raw"
);

const router = express.Router();

router.post(
    "/",
    verifyToken,
    upload.single("resume"),
    applyForJob
);

router.get(
    "/me",
    verifyToken,
    getMyApplications
);

router.get(
    "/job/:jobId",
    verifyToken,
    getJobApplicants
);

router.patch(
    "/:id/status",
    verifyToken,
    updateApplicationStatus
);

router.get(
    "/",
    verifyToken,
    getAllApplications
);

module.exports = router;