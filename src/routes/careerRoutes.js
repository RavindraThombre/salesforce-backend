const express = require("express");

const router = express.Router();

const {
    getPublishedJobs,
    getPublishedJobBySlug,
} = require("../controllers/jobPositionController");
// Public
router.get("/", getPublishedJobs);

router.get("/:slug", getPublishedJobBySlug);

module.exports = router;