import express from "express";
import upload from "../middlewares/upload.js";
import { uploadResume, processResume } from "../controllers/resume.controller.js";

const router = express.Router();

router.post("/upload", upload.single("resume"), uploadResume); // NEW
router.post("/analyze", upload.single("resume"), processResume);

export default router;
