// backend/src/services/gemini.service.js
import axios from "axios";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions"; // replace if you use a different Gemini endpoint
const API_KEY = process.env.GEMINI_API_KEY;

// Generate 5 unique questions for given round
export async function generateInterviewQuestions(jobTitle, round) {
  const interviewType = (round && round.toUpperCase() === "TR") ? "technical" : "hr";
  const prompt = interviewType === "technical"
    ? `Generate 5 unique, practical technical interview questions for the role: "${jobTitle}". Return questions each on a new line, no numbering, no extra text.`
    : `Generate 5 unique HR interview questions for the role: "${jobTitle}". Return questions each on a new line, no numbering, no extra text.`;
  // If no API key provided, return local fallback questions
  if (!API_KEY) {
    return localGenerateQuestions(jobTitle, interviewType);
  }

  try {
    const res = await axios.post(OPENAI_URL, {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
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
  const prompt = `
You are an expert interviewer. Evaluate the following ${roundLabel} round answers for the role "${jobTitle}".
Return a JSON array of objects corresponding to each answer in the same order.
Each object must have:
- score (integer 0-10)
- feedback (short string)

Answers:
${answers.map((a, i) => `${i + 1}. ${a || ""}`).join("\n")}

Strictly return only the JSON array.
`;

  try {
    const res = await axios.post(OPENAI_URL, {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const text = res.data.choices?.[0]?.message?.content || "";
    // Extract JSON array from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      // attempt a looser parse
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
