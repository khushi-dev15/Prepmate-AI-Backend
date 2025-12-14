import express from "express";
import upload from "../middlewares/upload.middleware.js";
import { processResume } from "../controllers/resume.controller.js";

const router = express.Router();

router.post(
  "/analyze",
  upload.single("resume"), // MUST match frontend FormData
  processResume
);

export default router;
