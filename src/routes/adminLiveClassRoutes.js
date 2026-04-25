// routes/adminLiveClassRoutes.js

const express = require("express");
const router = express.Router();

const {
    getLiveClasses,
    createLiveClass,
    deleteLiveClass,
} = require("../controllers/adminLiveClassController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyToken, isAdmin, getLiveClasses);
router.post("/", verifyToken, isAdmin, createLiveClass);
router.delete("/:id", verifyToken, isAdmin, deleteLiveClass);

module.exports = router;