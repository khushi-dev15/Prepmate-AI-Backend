import express from "express";
import multer from "multer";
import { uploadResume, processResume } from "../controllers/resume.controller.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/", // IMPORTANT
});

router.post("/upload", upload.single("resume"), uploadResume);
router.post("/process", upload.single("resume"), processResume);

export default router;
