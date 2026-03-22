// backend/src/services/gemini.service.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

// Lazy initialize model to ensure env vars are loaded
let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log("🔍 getModel() initializing...");
    console.log("   GEMINI_API_KEY set:", apiKey ? "YES ✅" : "NO ❌");
    
    if (!apiKey) {
      const error = "GEMINI_API_KEY is not configured. Please add it to .env file";
      console.error("❌", error);
      throw new Error(error);
    }
    
    // Validate API key format
    if (!apiKey.startsWith("gen-lang-client-")) {
      console.warn("⚠️  API key format seems unusual - should start with 'gen-lang-client-'");
      console.warn("   Key starts with:", apiKey.substring(0, 20));
    }
    
    try {
      console.log("   🔄 Initializing GoogleGenerativeAI...");
      genAI = new GoogleGenerativeAI(apiKey);
      console.log("   ✅ GoogleGenerativeAI object created");
      
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("   ✅ Model 'gemini-1.5-flash' loaded successfully");
    } catch (err) {
      console.error("   ❌ Failed to initialize GoogleGenerativeAI");
      console.error("   Error:", err.message);
      console.error("   Stack:", err.stack);
      throw err; // Re-throw so caller knows initialization failed
    }
  }
  return model;
}

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OpenAI_API_KEY;

// Generate 5 unique questions for given round
export async function generateInterviewQuestions(jobTitle, round, jobDescription = "") {
  const interviewType = (round && round.toUpperCase() === "TR") ? "technical" : "hr";
  // Include jobDescription if available to make questions tightly aligned to the job post
  const jobContext = jobDescription ? `Job description / context: ${jobDescription}\n` : "";
  // Strong, deterministic prompt so model generates questions tailored to the job title and description
  const prompt = interviewType === "technical"
    ? `${jobContext}You are an expert technical interviewer. Using the role title: "${jobTitle}", and the job context above when present, assume typical responsibilities and required technical skills for that role. Generate exactly 5 focused, practical technical interview questions that directly target skills, tools, algorithms, architecture, or problem-solving scenarios relevant to this role. Each question should be concise (one sentence) and reference the likely skill or concept being tested (e.g., "Concurrency in Node.js", "Database schema design", "Big-O complexity"). Return the questions as plain text, one question per line, with no numbering, no explanation, and no extra commentary.`
    : `${jobContext}You are an expert HR interviewer. Using the role title: "${jobTitle}", and the job context above when present, assume typical responsibilities and soft skills for that role. Generate exactly 5 HR interview questions that probe behavioral fit, communication, teamwork, leadership and culture-fit relevant to this role. Return the questions as plain text, one question per line, with no numbering, no explanation, and no extra commentary.`;

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const questions = text
      .split("\n")
      .map(q => q.replace(/^\s*[-•\d.)]+\s*/, "").trim())
      .filter(q => q.length > 5)
      .slice(0, 5);

    if (!questions.length) return localGenerateQuestions(jobTitle, interviewType);
    return questions;
  } catch (err) {
    console.error("generateInterviewQuestions error:", err.message);
    return localGenerateQuestions(jobTitle, interviewType);
  }
}

// Evaluate array of answers in one shot; returns array [{score, feedback}, ...]
export async function evaluateAnswersWithAI(answers, jobTitle, round) {
  // We ask model to return strict JSON array of objects
  const roundLabel = round === "TR" ? "Technical" : "HR";
  const prompt = `You are an expert interviewer. Evaluate the following ${roundLabel} round answers for the role "${jobTitle}".
Return ONLY a JSON array (no leading/trailing text) of objects in the same order as the answers.
Each object must contain exactly two fields:
- "score": integer between 0 and 10 (10 = excellent, 0 = poor).
- "feedback": concise (20-120 chars) actionable feedback sentence.

Scoring guidance: consider correctness, depth, relevance to the role, clarity, and use of role-relevant keywords. Be conservative and consistent.

Answers:
${answers.map((a, i) => `${i + 1}. ${a || ""}`).join("\n")}
`;

  try {
    console.log("🔄 evaluateAnswersWithAI starting...");
    console.log("   Getting model...");
    const model = getModel();
    console.log("   ✅ Model obtained");
    
    console.log("   📤 Calling model.generateContent()...");
    const result = await model.generateContent(prompt);
    console.log("   ✅ Response received from Gemini");
    
    const text = result.response.text();
    console.log("   📝 Response text length:", text.length);
    
    // Extract JSON-looking content robustly
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/m);
    if (!jsonMatch) {
      throw new Error("AI response not in expected JSON format: " + text.slice(0, 300));
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    console.log("   ✅ JSON parsed successfully, items:", parsed.length);
    
    const evaluation = parsed.map(item => ({
      score: typeof item.score === "number" ? item.score : parseInt(item.score) || 0,
      feedback: item.feedback || String(item.feedback || "")
    }));
    
    console.log("   ✅ Evaluation complete!");
    return evaluation;
  } catch (err) {
    console.error("❌ evaluateAnswersWithAI error:", err.message);
    console.error("   Error type:", err.constructor.name);
    console.error("   Stack:", err.stack);
    
    // Log more details for "token is not defined" error
    if (err.message && err.message.includes("token")) {
      console.error("   💡 This looks like a Gemini API key issue");
      console.error("   💡 GEMINI_API_KEY set?", !!process.env.GEMINI_API_KEY);
      console.error("   💡 Key starts with?", process.env.GEMINI_API_KEY?.substring(0, 30));
    }
    
    // fallback to local evaluator
    console.log("   🔄 Falling back to local evaluation...");
    return localEvaluateAnswers(answers, jobTitle, round);
  }
}

// Local fallback generators/evaluators
function localGenerateQuestions(jobTitle, interviewType) {
  const technicalQuestions = [
    `Explain your most recent ${jobTitle} project and your role in it.`,
    `Describe a technical challenge you faced related to ${jobTitle} tasks and how you solved it.`,
    `How do you approach debugging and testing in ${jobTitle || "software"} work?`,
    `Explain a core concept or tool commonly used in ${jobTitle} roles.`,
    `Describe your experience with collaborative version control (e.g., git) in ${jobTitle} projects.`,
    `How do you ensure code quality and maintainability in your ${jobTitle} work?`,
    `Explain your approach to problem-solving in ${jobTitle} scenarios.`,
    `What technologies or frameworks are you most proficient in for ${jobTitle} roles?`,
    `How do you stay updated with the latest trends in ${jobTitle} field?`,
    `Describe a time when you optimized performance in a ${jobTitle} project.`
  ];

  const hrQuestions = [
    `Tell me about yourself and why you applied for the ${jobTitle} role.`,
    `Describe a time you worked in a team and what you contributed.`,
    `How do you handle tight deadlines and pressure?`,
    `Describe a time you received feedback and how you incorporated it.`,
    `What motivates you to perform well in a ${jobTitle} position?`,
    `How do you handle conflicts or disagreements in a team setting?`,
    `Describe your ideal work environment for a ${jobTitle} role.`,
    `How do you prioritize tasks when working on multiple projects?`,
    `What are your career goals and how does this ${jobTitle} role fit into them?`,
    `How do you maintain work-life balance in a demanding role?`
  ];

  const questions = interviewType === "technical" ? technicalQuestions : hrQuestions;

  // Return 5 random questions without repetition
  const shuffled = questions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

function localEvaluateAnswers(answers, jobTitle, round) {
  // Basic heuristic: score based on length and presence of keywords
  return answers.map(ans => {
    const text = (ans || "").toLowerCase();
    let score = 0;
    if (text.length > 20) score += 3;
    if (text.length > 80) score += 3;
    if (text.split(" ").length > 40) score += 2;
    // keyword boost
    const keywords = jobTitle ? jobTitle.toLowerCase().split(/\W+/).filter(Boolean) : [];
    let kwMatches = 0;
    keywords.forEach(k => { if (k && text.includes(k)) kwMatches++; });
    score += Math.min(2, kwMatches);
    score = Math.min(10, Math.max(0, Math.round(score)));
    return { score, feedback: `Heuristic feedback: length ${text.length}, keywords matched ${kwMatches}` };
  });
}
