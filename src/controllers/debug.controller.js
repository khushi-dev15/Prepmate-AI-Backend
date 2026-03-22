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

// Test Gemini API connectivity
export async function testGeminiAPI(req, res) {
  try {
    const apiKeySet = !!process.env.GEMINI_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log("🔬 testGeminiAPI diagnostics:");
    console.log("   GEMINI_API_KEY set:", apiKeySet ? "YES" : "NO");
    if (apiKey) {
      console.log("   Key length:", apiKey.length);
      console.log("   Key starts with:", apiKey.substring(0, 30));
      console.log("   Key format ok?", apiKey.startsWith("gen-lang-client-") ? "YES" : "NO");
    }
    
    if (!apiKeySet) {
      return res.status(400).json({
        success: false,
        message: "GEMINI_API_KEY is not configured in .env"
      });
    }

    // Try to generate a test question
    const { generateInterviewQuestions } = await import("../services/gemini.service.js");
    const testQuestions = await generateInterviewQuestions("Software Engineer", "TR");
    
    return res.status(200).json({
      success: true,
      message: "Gemini API is working",
      testQuestions,
      apiKeyConfigured: true,
      apiKeyValid: apiKey && apiKey.startsWith("gen-lang-client-")
    });
  } catch (err) {
    console.error("❌ testGeminiAPI error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to test Gemini API",
      error: err.toString(),
      errorType: err.constructor.name
    });
  }
}

// Diagnostic endpoint for Gemini initialization
export async function diagnosticGemini(req, res) {
  try {
    console.log("🔬 Running Gemini diagnostic...");
    
    const apiKey = process.env.GEMINI_API_KEY;
    const diagnostics = {
      apiKeySet: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyStarts: apiKey?.substring(0, 30) || "NOT_SET",
      apiKeyValid: apiKey && apiKey.startsWith("gen-lang-client-"),
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      mongodbSet: !!process.env.MONGODB_URI
    };
    
    console.log("📋 Diagnostics:", JSON.stringify(diagnostics, null, 2));
    
    // Try to import and initialize the Google API
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      console.log("   ✅ @google/generative-ai imported");
      
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          message: "GEMINI_API_KEY not set",
          diagnostics,
          nextStep: "Set GEMINI_API_KEY in .env file"
        });
      }
      
      console.log("   🔄 Initializing GoogleGenerativeAI...");
      const genAI = new GoogleGenerativeAI(apiKey);
      console.log("   ✅ GoogleGenerativeAI initialized");
      
      console.log("   🔄 Getting model...");
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("   ✅ Model obtained");
      
      console.log("   🔄 Testing generateContent...");
      const result = await model.generateContent("Say 'test success' in one word");
      const text = result.response.text();
      console.log("   ✅ generateContent works! Response:", text);
      
      return res.status(200).json({
        success: true,
        message: "Gemini API fully functional",
        diagnostics,
        testResponse: text
      });
    } catch (initErr) {
      console.error("   ❌ Initialization error:", initErr.message);
      throw initErr;
    }
  } catch (err) {
    console.error("❌ diagnosticGemini error:", err);
    return res.status(500).json({
      success: false,
      message: "Diagnostic failed",
      error: err.message,
      errorType: err.constructor.name,
      stack: err.stack?.split('\n').slice(0, 5)
    });
  }
}
