// simple keyword-based ATS scorer
export function computeATSScore(text, jobTitle) {
  const lower = (text || '').toLowerCase();
  const titleTokens = jobTitle.toLowerCase().split(/\W+/).filter(Boolean);

  // example: skills list for jobTitle (in real app, fetch from DB or taxonomy)
  const skillsByTitle = {
    'frontend developer': ['react', 'javascript', 'html', 'css', 'redux', 'typescript', 'angular', 'vue'],
    'backend developer': ['node', 'express', 'mongodb', 'java', 'spring', 'python', 'django', 'postgresql'],
    'data scientist': ['python', 'pandas', 'numpy', 'ml', 'tensorflow', 'sklearn', 'sql', 'tableau'],
    'devops engineer': ['docker', 'kubernetes', 'terraform', 'jenkins', 'aws', 'gcp', 'cicd', 'linux'],
    'full stack developer': ['react', 'javascript', 'node', 'express', 'mongodb', 'sql', 'html', 'css']
  };

  // derive a skills list
  const skills = skillsByTitle[jobTitle.toLowerCase()] || titleTokens;

  // compute matches
  let matchCount = 0;
  let matchDetails = [];
  skills.forEach(s => { 
    if (lower.includes(s)) {
      matchCount++;
      matchDetails.push(s);
    }
  });

  // experience heuristic - look for X years mentions
  const expMatch = /(\d+)\s*(?:\+\s*)?years?/.exec(lower);
  const years = expMatch ? parseInt(expMatch[1], 10) : 0;
  const expScore = Math.min(years, 10) * 2; // 0-20
  
  // certifications bonus
  const certKeywords = ['certified', 'aws', 'gcp', 'azure', 'scrum', 'pmp', 'cissp'];
  const certBonus = certKeywords.filter(k => lower.includes(k)).length * 3;

  // project mentions bonus  
  const projectMatches = (lower.match(/project|developed|built|created|designed|implemented/g) || []).length;
  const projectBonus = Math.min(projectMatches * 2, 10);

  // education scan
  const eduBonus = /bachelor|master|b\.?s\.|m\.?s\.|degree|phd|b\.?tech|m\.?tech/.test(lower) ? 5 : 0;

  // simple scoring
  const skillScore = Math.round((matchCount / (skills.length || 1)) * 60); // 0-60
  const total = Math.min(100, skillScore + expScore + certBonus + projectBonus + eduBonus);

  const suggestions = [];
  if (matchCount < Math.max(1, Math.floor(skills.length/3))) {
    suggestions.push('Add more relevant skills to match job requirements.');
  }
  if (years < 1) suggestions.push('Mention years of experience or project durations.');
  if (!eduBonus) suggestions.push('Highlight educational qualifications.');
  if (certBonus === 0) suggestions.push('Industry certifications can improve your ATS score.');

  // matchPercent for response
  const matchPercent = total;

  return { score: total, matchPercent, suggestions, matchCount, skillsChecked: skills, matched: matchDetails };
}

// Also provide default export for compatibility
export default { computeATSScore };
