// src/controllers/resume.controller.js
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
// Handle both default export and direct export
const pdfParse = pdfParseModule.default || pdfParseModule;
import * as mammoth from "mammoth"; // DOCX parsing
import { promisify } from "util";
import { Resume } from "../models/resume.model.js";
import User from "../models/user.model.js";
import { computeATSScore } from "../services/ats.service.js";
import { generateInterviewQuestions } from "../services/gemini.service.js";

// Convert fs.readFile to promise-based
const readFileAsync = promisify(fs.readFile);

export const uploadResume = async (req, res) => {
  try {
    const { jobTitle } = req.body;
    const file = req.file;

    if (!jobTitle || !file) {
      return res.status(400).json({ message: "Missing job title or resume file" });
    }

    // Save resume record (optional user ID - can be anonymous)
    const saved = await Resume.create({
      user: req.user?._id || null,  // Can be null for anonymous users
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      jobTitleRequested: jobTitle,
    });

    // Update user profile if authenticated
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { 
        latestResumeId: saved._id,
        latestJobTitle: jobTitle 
      }, { new: true });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Resume uploaded successfully", 
      resumeId: saved._id 
    });
  } catch (err) {
    console.error("Error in uploadResume:", err);
    return res.status(500).json({ 
      message: "Server error while saving resume", 
      error: err.message 
    });
  }
};

export const processResume = async (req, res) => {
  try {
    console.log("🔍 processResume called with:", { 
      body: req.body,
      file: req.file?.originalname,
      method: req.method,
      url: req.originalUrl
    });
    
    const { jobTitle, resumeId } = req.body;
    const file = req.file;
    const userId = req.user?._id;

    // allow processing when either a file is uploaded or a stored resumeId is provided
    if (!jobTitle || (!file && !resumeId)) {
      console.warn("❌ Missing jobTitle or file/resumeId:", { jobTitle: !!jobTitle, file: !!file, resumeId: !!resumeId });
      return res.status(400).json({ message: "Missing jobTitle or file/resumeId" });
    }

    // Determine file path and original name either from uploaded file or stored resume record
    let filePathToRead;
    let originalNameToUse;
    if (file) {
      filePathToRead = file.path;
      originalNameToUse = file.originalname;
    } else {
      const storedResume = await Resume.findById(resumeId);
      if (!storedResume) {
        console.warn("❌ Resume id provided but not found:", resumeId);
        return res.status(404).json({ message: "Stored resume not found" });
      }
      filePathToRead = storedResume.path;
      originalNameToUse = storedResume.originalName;
    }

    console.log("✅ Starting resume processing for job:", jobTitle);

    let extractedText = "";
    const ext = path.extname(originalNameToUse).toLowerCase();

    // Read file with timeout to prevent hanging
    let buffer;
    try {
      buffer = await Promise.race([
        readFileAsync(filePathToRead),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("File read timeout")), 30000)
        )
      ]);
    } catch (fileErr) {
      console.error("❌ File read error:", fileErr.message);
      return res.status(500).json({ message: `Error reading file: ${fileErr.message}` });
    }

    if (ext === ".pdf") {
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || "";
      } catch (pdfErr) {
        console.error("❌ PDF parse error:", pdfErr?.message || pdfErr);
        return res.status(500).json({ message: `Error parsing PDF: ${pdfErr?.message || String(pdfErr)}` });
      }
    } else if (ext === ".docx") {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch (docErr) {
        console.error("❌ DOCX parse error:", docErr.message);
        return res.status(500).json({ message: `Error parsing DOCX: ${docErr.message}` });
      }
    } else {
      console.warn("❌ Unsupported file format:", ext);
      return res.status(400).json({ message: "Unsupported file format. Use PDF or DOCX." });
    }

    console.log("✅ Text extracted, length:", extractedText.length);

    // ATS scoring (local) and suggestions
    const ats = computeATSScore(extractedText, jobTitle || "");
    console.log("✅ ATS score calculated:", ats.score);

    // Determine whether job title looks technical
    const technicalKeywords = [
      "developer",
      "engineer",
      "software",
      "backend",
      "frontend",
      "fullstack",
      "devops",
      "data",
      "qa",
      "sde",
      "programmer",
      "machine",
      "ml",
      "ai"
    ];
    const lowerTitle = (jobTitle || "").toLowerCase();
    const isTechnical = technicalKeywords.some(k => lowerTitle.includes(k));
    const category = isTechnical ? "Technical" : "Non-Technical";

    const jobDescriptionFromReq = req.body.jobDescription || "";
    // Generate AI questions in parallel for faster response
    let trQuestions = [];
    let hrQuestions = [];
    
    try {
      [trQuestions, hrQuestions] = await Promise.allSettled([
        generateInterviewQuestions(jobTitle, "TR", jobDescriptionFromReq),
        generateInterviewQuestions(jobTitle, "HR", jobDescriptionFromReq)
      ]).then(results => [
        results[0].status === 'fulfilled' ? results[0].value : [],
        results[1].status === 'fulfilled' ? results[1].value : []
      ]);
      console.log("✅ AI questions generated");
    } catch (e) {
      console.warn("⚠️ Could not generate AI questions:", e.message);
    }

    // Normalized score for frontend (0-10)
    const normalizedScore = Math.round((ats.score || 0) / 10);

    // Update resume with analysis data
    if (resumeId) {
      await Resume.findByIdAndUpdate(resumeId, {
        analysis: {
          atsScore: ats.score,
          matchPercent: ats.matchPercent,
          suggestions: ats.suggestions,
          recommendedNext: ats.suggestions || []
        }
      });
    }

    return res.status(200).json({
    success: true,
    jobTitle,
    category,
    file: originalNameToUse,
      atsScore: ats.score,
      atsScoreNormalized: normalizedScore,
      matchPercent: ats.matchPercent,
      suggestions: ats.suggestions,
      suggestion: (ats.suggestions && ats.suggestions.length) ? ats.suggestions.join("; ") : "",
      trQuestions,
      hrQuestions,
      questions: isTechnical ? trQuestions : hrQuestions
    });
  } catch (err) {
    console.error("Error in processResume:", {
      message: err?.message,
      stack: err?.stack,
      responseData: err?.response?.data,
      responseStatus: err?.response?.status,
      originalFile: req.file?.originalname
    });
    return res.status(500).json({ 
      message: "Server error while processing resume",
      error: err?.message || "Unknown error",
      details: process.env.NODE_ENV === 'development' ? err?.response?.data : undefined
    });
  }
};

export const getUserResumes = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const resumes = await Resume.find({ user: userId })
      .select("originalName jobTitleRequested analysis createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      resumes: resumes || [],
      count: resumes.length
    });
  } catch (err) {
    console.error("Error in getUserResumes:", err);
    return res.status(500).json({ 
      message: "Server error while fetching resumes",
      error: err.message 
    });
  }
};
