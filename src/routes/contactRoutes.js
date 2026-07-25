const express = require("express");
const router = express.Router();

const { createContact, getContacts, replyToContact, deleteContact } = require("../controllers/contactController");
const { verifyToken } = require("../middleware/authMiddleware");
router.post("/", createContact);
router.get("/", verifyToken, getContacts)
router.put("/:id/reply", verifyToken, replyToContact);
router.delete("/:id", verifyToken, deleteContact);
module.exports = router;