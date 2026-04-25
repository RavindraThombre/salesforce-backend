const Contact = require("../models/Contact");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");

// ✅ CREATE CONTACT (PUBLIC)
exports.createContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const contact = await Contact.create({
            name,
            email,
            message,
        });

        // 🔥 GET ADMIN USERS
        const admins = await User.find({ role: "admin" });

        // 🔥 CREATE NOTIFICATION FOR ALL ADMINS
        for (const admin of admins) {
            await Notification.create({
                userId: admin._id,
                title: "New Contact Message",
                desc: `${name} sent a message`,
            });
        }

        res.status(201).json({
            message: "Message sent successfully ✅",
            data: contact,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ ADMIN REPLY
exports.replyToContact = async (req, res) => {
    try {
        const { reply } = req.body;

        if (!reply) {
            return res.status(400).json({
                message: "Reply is required",
            });
        }

        // ✅ get contact first
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                message: "Contact not found",
            });
        }

        // ✅ update contact
        contact.reply = reply;
        contact.status = "Replied";
        contact.repliedAt = new Date();

        await contact.save();

        // 🔥 ADD EMAIL HERE (IMPORTANT)
        await sendEmail({
            to: contact.email,
            subject: "Reply from Salesforce Academy",
            html: `
        <p>Hi ${contact.name},</p>
        <p>${reply}</p>
        <br/>
        <p>Thanks,<br/>Team</p>
      `,
        });

        res.json({
            message: "Reply sent successfully ✅",
            data: contact,
        });

    } catch (err) {
        console.error("REPLY ERROR:", err);
        res.status(500).json({ message: err.message });
    }
};