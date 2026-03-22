import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getCookieOptions } from "../utils/cookieOptions.js";

// ================= EMAIL CONFIG =================
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // generate JWT token
    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // ✅ Set cookie with secure options based on request protocol
    res.cookie("token", token, getCookieOptions(req));

    return res.status(201).json({ success: true, user: newUser, token });
  } catch (err) {
    console.error("🔥 registerUser error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // ✅ Render cookie with secure options based on request protocol
    res.cookie("token", token, getCookieOptions(req));

    return res.status(200).json({ success: true, user, token });
  } catch (err) {
    console.error("❌ Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ================= VERIFY TOKEN =================
export const verifyToken = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User ID not found in token" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("❌ Verify token error:", err);
    return res.status(500).json({ success: false, message: "Token verification failed" });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });

    // always return success for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const frontendURL = process.env.FRONTEND_URL || "https://prepmate-ai-website.onrender.com";
    const resetLink = `${frontendURL}/reset-password?token=${resetToken}&email=${email}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - PrepMate AI",
      html: `
        <h2>Password Reset</h2>
        <p>This link is valid for 1 hour.</p>
        <a href="${resetLink}"
           style="display:inline-block;padding:10px 20px;
           background:#ff0080;color:#fff;text-decoration:none;border-radius:5px;">
          Reset Password
        </a>
        <p>${resetLink}</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If email exists, a password reset link has been sent.",
    });
  } catch (err) {
    console.error("❌ Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Error sending reset email" });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ success: false, message: "Token, email and password are required" });
    }

    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    return res.status(500).json({ success: false, message: "Password reset failed" });
  }
};
