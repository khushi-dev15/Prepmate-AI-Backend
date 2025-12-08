// backend/src/services/resume.service.js

const analyzeResumeService = async (filePath, jobTitle) => {
  console.log(`🧠 Analyzing resume for job: ${jobTitle} | File: ${filePath}`);

  let jobType = "unknown";

  // Job title based logic ONLY
  const lowerJobTitle = jobTitle.toLowerCase();

  const technicalJobs = ["developer", "engineer", "react", "node", "java", "python", "frontend", "backend"];
  const nonTechnicalJobs = ["hr", "human resources", "manager", "marketing", "sales", "content", "support"];

  if (technicalJobs.some(kw => lowerJobTitle.includes(kw))) {
    jobType = "technical";
  } else if (nonTechnicalJobs.some(kw => lowerJobTitle.includes(kw))) {
    jobType = "non-technical";
  } else {
    jobType = "unknown";
  }

  // Dummy scores (can be replaced by real ATS scoring later)
  const atsScore = Math.floor(Math.random() * 20) + 80; // 80-99
  const matchPercent = Math.floor(Math.random() * 20) + 70; // 70-89

  // Suggestions based on job type
  const suggestions = jobType === "technical"
    ? [
        "Add your latest project links and GitHub profile.",
        "Highlight measurable results in your work section."
      ]
    : [
        "Highlight your soft skills and achievements.",
        "Add HR-related experience or certifications."
      ];

  return {
    atsScore,
    matchPercent,
    jobType,
    suggestions,
  };
};

export default analyzeResumeService;
