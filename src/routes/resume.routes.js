import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { uploadResume, processResume, getUserResumes } from "../controllers/resume.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

console.log("📍 Resume routes initializing...");

// Direct middleware approach - simplest
router.post("/upload", upload.single("resume"), uploadResume);

router.post("/process", upload.single("resume"), processResume);

router.get("/my-resumes", protect, getUserResumes);

console.log("✅ Resume routes initialized");

export default router;
