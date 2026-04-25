const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ✅ SEND EMAIL
exports.sendEmail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"Salesforce Academy" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};