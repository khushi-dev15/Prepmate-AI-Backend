export const processResume = async (req, res) => {
  try {
    const { jobTitle } = req.body;
    const file = req.file;

    // DEBUG logs to see what is coming
    console.log("JOB TITLE:", jobTitle);
    console.log("FILE:", file);

    if (!jobTitle || !file) {
      return res.status(400).json({ message: "Missing jobTitle or file" });
    }

    let extractedText = "";
    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === ".pdf") {
      try {
        const buffer = await readFileAsync(file.path);
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text || "";
      } catch (err) {
        console.error("PDF parse error:", err);
        return res.status(500).json({ message: "Error parsing PDF", error: err.message });
      }
    } else if (ext === ".docx") {
      try {
        const buffer = await readFileAsync(file.path);
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch (err) {
        console.error("DOCX parse error:", err);
        return res.status(500).json({ message: "Error parsing DOCX", error: err.message });
      }
    } else {
      return res.status(400).json({ message: "Unsupported file format" });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ message: "Could not extract text from resume" });
    }

    // ATS scoring (local)
    let ats;
    try {
      ats = computeATSScore(extractedText, jobTitle || "");
    } catch (err) {
      console.error("ATS scoring error:", err);
      return res.status(500).json({ message: "Error computing ATS score", error: err.message });
    }

    // Determine whether job title is technical
    const technicalKeywords = [
      "developer", "engineer", "software", "backend", "frontend",
      "fullstack", "devops", "data", "qa", "sde",
      "programmer", "machine", "ml", "ai"
    ];
    const lowerTitle = (jobTitle || "").toLowerCase();
    const isTechnical = technicalKeywords.some(k => lowerTitle.includes(k));
    const category = isTechnical ? "Technical" : "Non-Technical";

    // AI-generated questions
    let trQuestions = [];
    let hrQuestions = [];
    try {
      trQuestions = await generateInterviewQuestions(jobTitle, "TR");
    } catch (e) {
      console.warn("Could not generate TR questions via AI, using fallback", e.message);
    }
    try {
      hrQuestions = await generateInterviewQuestions(jobTitle, "HR");
    } catch (e) {
      console.warn("Could not generate HR questions via AI, using fallback", e.message);
    }

    // normalized score for frontend (0-10)
    const normalizedScore = Math.round((ats.score || 0) / 10);

    return res.status(200).json({
      success: true,
      jobTitle,
      category,
      file: file.originalname,
      atsScore: ats.score,
      atsScoreNormalized: normalizedScore,
      matchPercent: ats.matchPercent,
      suggestions: ats.suggestions,
      suggestion: (ats.suggestions && ats.suggestions.length) ? ats.suggestions.join("; ") : "",
      trQuestions,
      hrQuestions,
      questions: isTechnical ? trQuestions : hrQuestions
    });

  } catch (err) {
    console.error("PROCESS RESUME ERROR ❌", err);
    return res.status(500).json({
      message: "Server error while processing resume",
      error: err.message
    });
  }
};
