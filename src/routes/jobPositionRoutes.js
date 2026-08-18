const express = require("express");

const router = express.Router();

const {
    createJobPosition,
    getJobPositions,
    getJobPosition,
    updateJobPosition,
    deleteJobPosition,
    updateJobStatus,
} = require("../controllers/jobPositionController");

const createUploader = require("../middleware/upload");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const upload = createUploader("careers");
// Admin CRUD
router.post("/", verifyToken, isAdmin, upload.single("banner"), createJobPosition);
router.get("/", verifyToken, isAdmin, getJobPositions);
router.get("/:id", verifyToken, isAdmin, getJobPosition);
router.put("/:id", verifyToken, isAdmin, upload.single("banner"), updateJobPosition);
router.delete("/:id", verifyToken, isAdmin, deleteJobPosition);
router.patch("/:id/status", verifyToken, isAdmin, updateJobStatus);

module.exports = router;