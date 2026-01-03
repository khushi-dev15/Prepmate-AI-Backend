import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findOneUser } from "../dao/user.dao.js";

export const registerController = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: "All fields required" });

    const existing = await findOneUser({ email });
    if (existing) return res.status(400).json({ message: "User already exists with this email" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await createUser({ username, email, password: hashed });

    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    res.status(201).json({ success: true, user: { id: newUser._id, username, email }, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message || "Registration failed" });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await findOneUser({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });

    res.status(200).json({ success: true, user: { id: user._id, username: user.username, email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message || "Login failed" });
  }
};

export const getProfileController = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    // lazy-load here to avoid circular imports at top-level
    const User = (await import('../models/user.model.js')).default;
    const Result = (await import('../models/result.model.js')).default;
    const Resume = (await import('../models/resume.model.js')).Resume || (await import('../models/resume.model.js')).default;

    const user = await User.findById(userId).select('username email createdAt latestResumeId latestJobTitle').lean();
    const results = await Result.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const resumes = await Resume.find({ user: userId }).select('originalName jobTitleRequested analysis createdAt').sort({ createdAt: -1 }).lean();

    return res.status(200).json({ success: true, user, results, resumes });
  } catch (err) {
    console.error('getProfileController error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
