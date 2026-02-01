import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Configure email transporter (using Gmail or your email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

// Forgot Password - Send Reset Email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        message: "If email exists, a password reset link has been sent."
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Link - PrepMate AI",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block; padding: 10px 20px; background-color: #ff0080; color: white; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>Or copy this link: ${resetLink}</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "If email exists, a password reset link has been sent."
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Error sending reset email. Please try again later."
    });
  }
};

// Reset Password - Verify Token & Update Password
export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ message: "Token, email, and password are required" });
    }

    // Hash the token to compare
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      email,
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash the new password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash(password, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please login with your new password."
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Verify JWT Token (for persistent login)
export const verifyToken = async (req, res) => {
  try {
    // The protect middleware already verified the token and set req.user
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
