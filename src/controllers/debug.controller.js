import mongoose from "mongoose";
import User from "../models/user.model.js";
import Result from "../models/result.model.js";
import { Resume } from "../models/resume.model.js";

export async function getDbStatus(req, res) {
  try {
    const connState = mongoose.connection.readyState; // 1 = connected
    const users = await User.countDocuments();
    const results = await Result.countDocuments();
    const resumes = await Resume.countDocuments();
    return res.status(200).json({ success: true, connState, counts: { users, results, resumes } });
  } catch (err) {
    console.error("getDbStatus error:", err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function peekRecent(req, res) {
  try {
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt');
    const recentResults = await Result.find().sort({ createdAt: -1 }).limit(5);
    const recentResumes = await Resume.find().sort({ createdAt: -1 }).limit(5);
    return res.status(200).json({ success: true, recent: { users: recentUsers, results: recentResults, resumes: recentResumes } });
  } catch (err) {
    console.error('peekRecent error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}
