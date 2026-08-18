const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");

// ================= SIGNUP =================
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // check existing user
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "student",
        });

        await user.save();

        await Student.create({
            userId: user._id,
            city: "",
            phone: "",
        });

        res.json({
            message: "Signup successful",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        // validation
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // check user
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // create token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: normalizedEmail,
        });

        // Do not reveal whether the email exists
        if (!user) {
            return res.json({
                message:
                    "If an account exists with this email, a password reset link has been sent.",
            });
        }

        // Generate random token
        const resetToken = crypto
            .randomBytes(32)
            .toString("hex");

        // Hash token before storing in MongoDB
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;

        // Token expires after 15 minutes
        user.resetPasswordExpires =
            Date.now() + 15 * 60 * 1000;

        await user.save();

        // Raw token is sent only through email
        const resetUrl =
            `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

        try {
            await transporter.sendMail({
                from: `"Salesforce Academy" <${process.env.EMAIL_USER}>`,

                to: user.email,

                subject:
                    "Reset your Salesforce Academy password",

                html: `
                    <div
                        style="
                            font-family: Arial, sans-serif;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        "
                    >
                        <h2>
                            Reset your password
                        </h2>

                        <p>
                            Hello ${user.name || "User"},
                        </p>

                        <p>
                            We received a request to reset
                            the password for your Salesforce
                            Academy account.
                        </p>

                        <p>
                            Click the button below to create
                            a new password.
                        </p>

                        <a
                            href="${resetUrl}"
                            style="
                                display: inline-block;
                                padding: 12px 20px;
                                background: #111827;
                                color: #ffffff;
                                text-decoration: none;
                                border-radius: 6px;
                                margin: 16px 0;
                            "
                        >
                            Reset Password
                        </a>

                        <p>
                            This password reset link will
                            expire in 15 minutes.
                        </p>

                        <p>
                            If you did not request a password
                            reset, you can safely ignore this
                            email.
                        </p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error(
                "Password reset email error:",
                emailError,
            );

            // Remove token because email failed
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            return res.status(500).json({
                message:
                    "Unable to send password reset email",
            });
        }

        return res.json({
            message:
                "If an account exists with this email, a password reset link has been sent.",
        });
    } catch (error) {
        console.error(
            "Forgot password error:",
            error,
        );

        return res.status(500).json({
            message: "Server error",
        });
    }
};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
    try {
        const {
            token,
            newPassword,
        } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                message:
                    "Token and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message:
                    "Password must be at least 6 characters",
            });
        }

        // Hash token from reset URL
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find user with valid non-expired token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,

            resetPasswordExpires: {
                $gt: Date.now(),
            },
        });

        if (!user) {
            return res.status(400).json({
                message:
                    "Password reset link is invalid or has expired",
            });
        }

        // Hash new password
        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10,
            );

        user.password = hashedPassword;

        // Remove token so it cannot be reused
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.json({
            message:
                "Password reset successfully",
        });
    } catch (error) {
        console.error(
            "Reset password error:",
            error,
        );

        return res.status(500).json({
            message: "Server error",
        });
    }
};