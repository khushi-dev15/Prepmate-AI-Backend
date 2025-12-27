// backend/src/services/gemini.service.js
import axios from "axios";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"; // replace if you use a different Gemini endpoint
const API_KEY = process.env.GEMINI_API_KEY;

// Generate 5 unique questions for given round
export async function generateInterviewQuestions(jobTitle, round, jobDescription = "") {
  const interviewType = (round && round.toUpperCase() === "TR") ? "technical" : "hr";
  // Include jobDescription if available to make questions tightly aligned to the job post
  const jobContext = jobDescription ? `Job description / context: ${jobDescription}\n` : "";
  // Strong, deterministic prompt so model generates questions tailored to the job title and description
  const prompt = interviewType === "technical"
    ? `${jobContext}You are an expert technical interviewer. Using the role title: "${jobTitle}", and the job context above when present, assume typical responsibilities and required technical skills for that role. Generate exactly 5 focused, practical technical interview questions that directly target skills, tools, algorithms, architecture, or problem-solving scenarios relevant to this role. Each question should be concise (one sentence) and reference the likely skill or concept being tested (e.g., "Concurrency in Node.js", "Database schema design", "Big-O complexity"). Return the questions as plain text, one question per line, with no numbering, no explanation, and no extra commentary.`
    : `${jobContext}You are an expert HR interviewer. Using the role title: "${jobTitle}", and the job context above when present, assume typical responsibilities and soft skills for that role. Generate exactly 5 HR interview questions that probe behavioral fit, communication, teamwork, leadership and culture-fit relevant to this role. Return the questions as plain text, one question per line, with no numbering, no explanation, and no extra commentary.`;
  // If no API key provided, return local fallback questions
  if (!API_KEY) {
    return localGenerateQuestions(jobTitle, interviewType);
  }

  try {
    const res = await axios.post(OPENAI_URL, {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.2
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000
    });

    const text = res.data.choices?.[0]?.message?.content || "";
    const questions = text
      .split("\n")
      .map(q => q.replace(/^\s*[-•\d.)]+\s*/, "").trim())
      .filter(q => q.length > 5)
      .slice(0, 5);

    if (!questions.length) return localGenerateQuestions(jobTitle, interviewType);
    return questions;
  } catch (err) {
    console.error("generateInterviewQuestions error:", err?.response?.data || err.message);
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
    const res = await axios.post(OPENAI_URL, {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
      temperature: 0.2
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 20000
    });

    const text = res.data.choices?.[0]?.message?.content || "";
    // Extract JSON-looking content robustly
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/m);
    if (!jsonMatch) {
      throw new Error("AI response not in expected JSON format: " + text.slice(0, 300));
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.map(item => ({
      score: typeof item.score === "number" ? item.score : parseInt(item.score) || 0,
      feedback: item.feedback || String(item.feedback || "")
    }));
  } catch (err) {
    console.error("evaluateAnswersWithAI error:", err?.response?.data || err.message);
    // fallback to local evaluator
    return localEvaluateAnswers(answers, jobTitle, round);
  }
}

// Local fallback generators/evaluators
function localGenerateQuestions(jobTitle, type) {
  if (type === "technical") {
    return [
      `Explain your most recent ${jobTitle} project and your role in it.`,
      `Describe a technical challenge you faced related to ${jobTitle} tasks and how you solved it.`,
      `How do you approach debugging and testing in ${jobTitle || "software"} work?`,
      `Explain a core concept or tool commonly used in ${jobTitle} roles.`,
      `Describe your experience with collaborative version control (e.g., git) in ${jobTitle} projects.`
    ];
  }
  return [
    `Tell me about yourself and why you applied for the ${jobTitle} role.`,
    `Describe a time you worked in a team and what you contributed.`,
    `How do you handle tight deadlines and pressure?`,
    `Describe a time you received feedback and how you incorporated it.`,
    `What motivates you to perform well in a ${jobTitle} position?`
  ];
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
