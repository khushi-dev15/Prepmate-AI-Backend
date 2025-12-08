// simple keyword-based ATS scorer
export function computeATSScore(text, jobTitle) {
  const lower = (text || '').toLowerCase();
  const titleTokens = jobTitle.toLowerCase().split(/\W+/).filter(Boolean);

  // example: skills list for jobTitle (in real app, fetch from DB or taxonomy)
  const skillsByTitle = {
    'frontend developer': ['react', 'javascript', 'html', 'css', 'redux'],
    'backend developer': ['node', 'express', 'mongodb', 'java', 'spring'],
    'data scientist': ['python', 'pandas', 'numpy', 'ml', 'tensorflow']
    // extend as needed, or fetch from db
  };

  // derive a skills list
  const skills = skillsByTitle[jobTitle.toLowerCase()] || titleTokens;

  // compute matches
  let matchCount = 0;
  skills.forEach(s => { if (lower.includes(s)) matchCount++; });

  // experience heuristic
  const expMatch = /(\d+)\s+years?/.exec(lower);
  const years = expMatch ? parseInt(expMatch[1], 10) : 0;
  const expScore = Math.min(years, 10) * 2; // 0-20

  // simple scoring
  const skillScore = Math.round((matchCount / (skills.length || 1)) * 80); // 0-80
  const total = Math.min(100, skillScore + expScore);

  const suggestions = [];
  if (matchCount < Math.max(1, Math.floor(skills.length/2))) {
    suggestions.push('Add/reorder key skills related to the job title.');
  }
  if (years < 1) suggestions.push('Mention internships or projects with durations.');

  // matchPercent for response
  const matchPercent = total;

  return { score: total, matchPercent, suggestions, matchCount, skillsChecked: skills };
}

// Also provide default export for compatibility
export default { computeATSScore };
