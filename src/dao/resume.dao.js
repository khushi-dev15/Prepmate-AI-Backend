// src/dao/resume.dao.js
export const saveResumeAnalysis = async (userId, jobTitle, result) => {
  try {
    // Future DB save logic (Mongo, SQL etc.)
    console.log(`📁 Saving analysis for user: ${userId}, job: ${jobTitle}`);
    console.log("Result summary:", result);
    return { success: true, ...result };
  } catch (error) {
    console.error("❌ Error saving resume analysis:", error);
    throw new Error("Database error while saving resume analysis");
  }
};
