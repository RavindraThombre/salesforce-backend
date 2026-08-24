// routes/adminLiveClassRoutes.js

const express = require("express");
const router = express.Router();

const {
    getLiveClasses,
    createLiveClass,
    deleteLiveClass,
    updateLiveClass,
} = require("../controllers/adminLiveClassController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyToken, isAdmin, getLiveClasses);
router.post("/", verifyToken, isAdmin, createLiveClass);
router.put(
    "/:id",
    verifyToken,
    isAdmin,
    updateLiveClass,
);
router.delete("/:id", verifyToken, isAdmin, deleteLiveClass);

module.exports = router;