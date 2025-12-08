// backend/src/controllers/interview.controller.js
import { generateInterviewQuestions, evaluateAnswersWithAI } from "../services/gemini.service.js";
import Result from "../models/result.model.js";
import { Resume } from "../models/resume.model.js";

export async function getInterviewQuestions(req, res) {
  const jobTitle = req.body.jobTitle || req.query.jobTitle || "";
  const round = req.body.round || req.query.round || "TR"; // TR or HR
  try {
    const questions = await generateInterviewQuestions(jobTitle, round);
    res.status(200).json({
      success: true,
      jobTitle,
      questions,
      round
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function evaluateInterviewAnswer(req, res) {
  // expects { answers: ["..."], jobTitle: "...", round: "TR" }
  const { answers, jobTitle, round } = req.body;
  if (!Array.isArray(answers)) return res.status(400).json({ success: false, message: "answers must be an array" });
  try {
    const evaluation = await evaluateAnswersWithAI(answers, jobTitle, round || "HR");
    res.status(200).json({ success: true, evaluation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// submit final result and save to DB
export async function submitFinalResult(req, res) {
  const { jobTitle, category, trEvaluation = [], hrEvaluation = [], resumeId } = req.body;
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    console.log("submitFinalResult payload:", { userId, jobTitle, category, trCount: trEvaluation.length, hrCount: hrEvaluation.length, resumeId });
    const trScore = trEvaluation.reduce((s, e) => s + (e.score || 0), 0);
    const hrScore = hrEvaluation.reduce((s, e) => s + (e.score || 0), 0);
    const totalScore = trScore + hrScore;
    const saved = await Result.create({ user: userId, jobTitle, category, trEvaluation, hrEvaluation, trScore, hrScore, totalScore });
    console.log("Result saved id:", saved._id && saved._id.toString());
    // attach resume to result if provided
    if (resumeId) {
      await Resume.findByIdAndUpdate(resumeId, { $set: { jobTitleRequested: jobTitle } });
    }
    res.status(201).json({ success: true, result: saved });
  } catch (err) {
    console.error("submitFinalResult error:", err && err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function fetchUserResults(req, res) {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
  try {
    const results = await Result.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
 