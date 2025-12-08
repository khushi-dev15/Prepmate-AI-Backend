// src/controllers/resume.controller.js
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import * as mammoth from "mammoth"; // DOCX parsing
import { promisify } from "util";
import { Resume } from "../models/resume.model.js";
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

    // Save minimal resume record
    const saved = await Resume.create({
      user: req.user?._id || null,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      jobTitleRequested: jobTitle,
    });

    return res.status(200).json({ success: true, message: "Resume uploaded successfully", resumeId: saved._id });
  } catch (err) {
    console.error("Error in uploadResume:", err);
    // Return error details to frontend for quicker debugging (trim stack)
    return res.status(500).json({ message: "Server error while saving resume", error: err.message, stack: err.stack ? String(err.stack).slice(0, 1000) : undefined });
  }
};

export const processResume = async (req, res) => {
  try {
    const { jobTitle } = req.body;
    const file = req.file;

    if (!jobTitle || !file) return res.status(400).json({ message: "Missing jobTitle or file" });

    let extractedText = "";
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === ".pdf") {
      const buffer = await readFileAsync(file.path);
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } else if (ext === ".docx") {
      const buffer = await readFileAsync(file.path);
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else {
      return res.status(400).json({ message: "Unsupported file format" });
    }

    // ATS scoring (local) and suggestions
    const ats = computeATSScore(extractedText, jobTitle || "");

    // Determine whether job title looks technical (simple heuristic)
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

    // Try to get AI suggestions/questions for both rounds, but fall back to local if AI not available
    let trQuestions = [];
    let hrQuestions = [];
    try {
      trQuestions = await generateInterviewQuestions(jobTitle, "TR");
    } catch (e) {
      console.warn("Could not generate TR questions via AI, using fallback", e.message);
    }
    try {
      hrQuestions = await generateInterviewQuestions(jobTitle, "HR");
    } catch (e) {
      console.warn("Could not generate HR questions via AI, using fallback", e.message);
    }

    // normalized score for frontend (0-10)
    const normalizedScore = Math.round((ats.score || 0) / 10);

    return res.status(200).json({
      success: true,
      jobTitle,
      category,
      file: file.originalname,
      atsScore: ats.score,
      atsScoreNormalized: normalizedScore,
      matchPercent: ats.matchPercent,
      suggestions: ats.suggestions,
      suggestion: (ats.suggestions && ats.suggestions.length) ? ats.suggestions.join("; ") : "",
      trQuestions,
      hrQuestions,
      // for quick UI compatibility keep `questions` as TR for technical else HR for non-technical
      questions: isTechnical ? trQuestions : hrQuestions
    });
  } catch (err) {
    console.error("Error in processResume:", err);
    return res.status(500).json({ message: "Server error while processing resume" });
  }
};
