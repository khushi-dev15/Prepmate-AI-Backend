import express from "express";
import { getInterviewQuestions, evaluateInterviewAnswer, submitFinalResult, fetchUserResults } from "../controllers/interview.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/questions", protect, getInterviewQuestions);

router.post("/evaluate", protect, evaluateInterviewAnswer);

router.post("/submit", protect, submitFinalResult);

router.get("/results", protect, fetchUserResults);

export default router;
