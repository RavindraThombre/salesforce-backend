// routes/adminPaymentRoutes.js

const express = require("express");
const router = express.Router();

const { getAllPaymentsAdmin, updatePaymentStatus } = require("../controllers/adminPaymentController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyToken, isAdmin, getAllPaymentsAdmin);
router.put("/payments/:paymentId", verifyToken, isAdmin, updatePaymentStatus);

module.exports = router;