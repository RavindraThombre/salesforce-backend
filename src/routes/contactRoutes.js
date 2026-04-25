const express = require("express");
const router = express.Router();

const { createContact, getContacts, replyToContact } = require("../controllers/contactController");
const { verifyToken } = require("../middleware/authMiddleware");
router.post("/", createContact);
router.get("/", verifyToken, getContacts)
router.put("/:id/reply", verifyToken, replyToContact);
module.exports = router;