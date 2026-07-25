const express = require("express");
const router = express.Router();

const {
    getTrainerClasses,
    getTrainerCourses,
    createTrainer,
    getTrainers,
    deleteTrainer,
    updateTrainer,
    getTrainerProfile,
    updateTrainerProfile,
    changeTrainerPassword,
} = require("../controllers/trainerController");

const { verifyToken } = require("../middleware/authMiddleware");
const createUploader = require("../middleware/upload");
const upload = createUploader("trainers");


// ### 🔐 TRAINER ROUTES
router.get("/live-classes", verifyToken, getTrainerClasses);
router.get("/trainer-courses", verifyToken, getTrainerCourses);

// ✅ PROFILE ROUTES
router.get("/profile", verifyToken, getTrainerProfile);
router.put(
    "/profile",
    verifyToken,
    upload.single("avatar"),
    updateTrainerProfile
);
// 🔐 PASSWORD
router.put(
    "/change-password",
    verifyToken,
    changeTrainerPassword
);


// ### 🔐 ADMIN ROUTES
router.post("/create", verifyToken, createTrainer);
router.get("/", verifyToken, getTrainers);
router.delete("/:id", verifyToken, deleteTrainer);
router.put("/:id", verifyToken, updateTrainer);

module.exports = router;