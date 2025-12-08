
async function getResumeAnalysis({ text, jobTitle }) {
  return {
    suggestions: [
      `Improve summary to mention ${jobTitle} directly.`,
      'Add 3 bullets for measurable achievements (numbers).'
    ],
    detailed: {
      strengths: ['Projects section present', 'Relevant internship'],
      weaknesses: ['Missing key skills: React, Redux']
    }
  };
}

module.exports = { getResumeAnalysis };
