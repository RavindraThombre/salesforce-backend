const express = require("express");
const router = express.Router();
const { getAdminDashboard } = require("../controllers/dashboardController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/admin", verifyToken, isAdmin, getAdminDashboard);

module.exports = router;