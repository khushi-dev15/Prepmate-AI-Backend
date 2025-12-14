import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { uploadResume, processResume } from "../controllers/resume.controller.js";

const router = express.Router();

// Upload resume
router.post("/upload", upload.single("resume"), uploadResume);

// Analyze resume (ATS + AI questions)
router.post("/analyze", upload.single("resume"), processResume);

export default router;
