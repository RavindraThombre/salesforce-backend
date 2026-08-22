const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mailer");
const googleClient = require("../config/googleAuth");

// ================= SIGNUP =================
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // ================= VALIDATION =================
        if (!name?.trim()) {
            return res.status(400).json({
                message: "Name is required",
            });
        }

        if (!email?.trim()) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        if (!password) {
            return res.status(400).json({
                message: "Password is required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        // ================= CHECK EXISTING USER =================
        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }
        // ================= HASH PASSWORD =================
        const hashedPassword = await bcrypt.hash(password, 10);
        // ================= CREATE USER =================
        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            authProvider: "local",
            role: "student",
        });
        // ================= CREATE STUDENT =================
        await Student.create({
            userId: user._id,
            city: "",
            phone: "",
        });

        return res.status(201).json({
            message: "Signup successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error("Signup error:", err);

        return res.status(500).json({
            message: "Unable to create account",
        });
    }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ================= VALIDATION =================

        if (!email?.trim() || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // ================= FIND USER =================

        const user = await User.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // ================= GOOGLE ONLY ACCOUNT =================

        if (!user.password) {
            return res.status(400).json({
                message:
                    "This account uses Google Sign-In. Please continue with Google.",
            });
        }

        // ================= COMPARE PASSWORD =================

        const isMatch = await bcrypt.compare(
            password,
            user.password,
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials",
            });
        }

        // ================= CREATE JWT =================

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            },
        );

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (err) {
        console.error("Login error:", err);

        return res.status(500).json({
            message: "Login failed. Please try again.",
        });
    }
};


// ================= GOOGLE AUTH =================
exports.googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        // ================= VALIDATION =================

        if (!credential) {
            return res.status(400).json({
                message: "Google credential is required",
            });
        }

        // ================= VERIFY GOOGLE TOKEN =================

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload) {
            return res.status(401).json({
                message: "Invalid Google authentication",
            });
        }

        const {
            sub: googleId,
            email,
            email_verified,
            name,
            picture,
        } = payload;

        // ================= VALIDATE GOOGLE DATA =================

        if (!googleId) {
            return res.status(400).json({
                message: "Google account ID is missing",
            });
        }

        if (!email) {
            return res.status(400).json({
                message: "Google account email is missing",
            });
        }

        if (!email_verified) {
            return res.status(400).json({
                message: "Please verify your Google email before continuing",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        let user;

        // =====================================================
        // CASE 1: USER ALREADY EXISTS WITH GOOGLE ID
        // =====================================================

        user = await User.findOne({
            googleId,
        });

        // =====================================================
        // CASE 2: GOOGLE ID NOT FOUND
        // CHECK USER BY EMAIL
        // =====================================================

        if (!user) {
            user = await User.findOne({
                email: normalizedEmail,
            });

            // =================================================
            // CASE 2A: LOCAL USER EXISTS WITH SAME EMAIL
            // LINK GOOGLE ACCOUNT
            // =================================================

            if (user) {
                // Security check:
                // Do not allow a different Google account
                // to replace an existing Google ID.

                if (
                    user.googleId &&
                    user.googleId !== googleId
                ) {
                    return res.status(400).json({
                        message:
                            "This email is already linked to another Google account",
                    });
                }

                // Link Google account

                user.googleId = googleId;

                // Keep existing authProvider if user has password.
                // This allows BOTH local login and Google login.

                if (!user.password) {
                    user.authProvider = "google";
                }

                // Add avatar only if user doesn't already have one

                if (!user.avatar && picture) {
                    user.avatar = picture;
                }

                await user.save();
            }

            // =================================================
            // CASE 2B: NEW GOOGLE USER
            // CREATE USER + STUDENT
            // =================================================

            else {
                user = await User.create({
                    name: name?.trim() || "Google User",
                    email: normalizedEmail,
                    password: null,
                    googleId,
                    authProvider: "google",
                    avatar: picture || "",
                    role: "student",
                });

                await Student.create({
                    userId: user._id,
                    city: "",
                    phone: "",
                });
            }
        }

        // =====================================================
        // CREATE JWT
        // =====================================================

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        return res.status(200).json({
            message: "Google authentication successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error("Google authentication error:", error);

        return res.status(401).json({
            message:
                "Google authentication failed. Please try again.",
        });
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