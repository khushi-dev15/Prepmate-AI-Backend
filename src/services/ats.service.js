// Enhanced keyword-based ATS scorer
export function computeATSScore(text, jobTitle) {
  const lower = (text || '').toLowerCase();
  const titleTokens = jobTitle.toLowerCase().split(/\W+/).filter(Boolean);

  // Expanded skills list for jobTitle
  const skillsByTitle = {
    'frontend developer': ['react', 'javascript', 'html', 'css', 'redux', 'typescript', 'angular', 'vue', 'webpack', 'babel', 'sass', 'bootstrap', 'jquery'],
    'backend developer': ['node', 'express', 'mongodb', 'java', 'spring', 'python', 'django', 'postgresql', 'mysql', 'redis', 'graphql', 'rest', 'api'],
    'data scientist': ['python', 'pandas', 'numpy', 'ml', 'tensorflow', 'sklearn', 'sql', 'tableau', 'r', 'jupyter', 'matplotlib', 'seaborn'],
    'devops engineer': ['docker', 'kubernetes', 'terraform', 'jenkins', 'aws', 'gcp', 'azure', 'cicd', 'linux', 'bash', 'ansible', 'git'],
    'full stack developer': ['react', 'javascript', 'node', 'express', 'mongodb', 'sql', 'html', 'css', 'typescript', 'git', 'api', 'database'],
    'software engineer': ['java', 'python', 'javascript', 'c++', 'algorithms', 'data structures', 'oop', 'git', 'testing', 'agile'],
    'web developer': ['html', 'css', 'javascript', 'php', 'mysql', 'wordpress', 'laravel', 'bootstrap', 'jquery']
  };

  // Get skills for the job title, fallback to title tokens
  const skills = skillsByTitle[jobTitle.toLowerCase()] || titleTokens;

  // Compute matches
  let matchCount = 0;
  let matchDetails = [];
  skills.forEach(s => {
    if (lower.includes(s)) {
      matchCount++;
      matchDetails.push(s);
    }
  });

  // Experience heuristic - look for X years mentions
  const expMatch = /(\d+)\s*(?:\+\s*)?years?/.exec(lower);
  const years = expMatch ? parseInt(expMatch[1], 10) : 0;
  const expScore = Math.min(years * 2, 20); // 0-20

  // Certifications bonus
  const certKeywords = ['certified', 'aws', 'gcp', 'azure', 'scrum', 'pmp', 'cissp', 'ccna', 'mcsa', 'oracle'];
  const certBonus = certKeywords.filter(k => lower.includes(k)).length * 3;

  // Project mentions bonus
  const projectMatches = (lower.match(/project|developed|built|created|designed|implemented|deployed/g) || []).length;
  const projectBonus = Math.min(projectMatches * 2, 15);

  // Education scan
  const eduKeywords = ['bachelor', 'master', 'b.s.', 'm.s.', 'degree', 'phd', 'b.tech', 'm.tech', 'b.e.', 'm.e.', 'mca', 'bca'];
  const eduBonus = eduKeywords.some(k => lower.includes(k)) ? 10 : 0;

  // Technology stack bonus
  const techStack = ['git', 'github', 'linux', 'windows', 'mac', 'agile', 'scrum', 'kanban'];
  const techBonus = techStack.filter(k => lower.includes(k)).length * 2;

  // Simple scoring
  const skillScore = skills.length > 0 ? Math.round((matchCount / skills.length) * 50) : 25; // 0-50
  const total = Math.min(100, skillScore + expScore + certBonus + projectBonus + eduBonus + techBonus);

  const suggestions = [];
  const suggestionPool = {
    skills: [
      'Add more relevant technical skills to match job requirements.',
      'Include specific technologies and tools mentioned in the job description.',
      'Highlight proficiency levels for key skills (beginner, intermediate, expert).',
      'Add industry-specific keywords that ATS systems look for.'
    ],
    experience: [
      'Include years of experience or project durations.',
      'Quantify your achievements with specific metrics and results.',
      'Describe your role and responsibilities in detail.',
      'Mention relevant work experience and internships.'
    ],
    education: [
      'Highlight your educational qualifications.',
      'Include relevant coursework or projects from your degree.',
      'Mention academic achievements and GPA if impressive.',
      'Add any relevant certifications or online courses.'
    ],
    certifications: [
      'Consider adding industry certifications to improve your ATS score.',
      'Include cloud certifications (AWS, Azure, GCP) if applicable.',
      'Add programming language certifications or framework-specific credentials.',
      'Include project management certifications like Scrum or PMP.'
    ],
    projects: [
      'Describe your projects and achievements in detail.',
      'Include links to GitHub repositories or live demos.',
      'Quantify project impact (users served, performance improvements, etc.).',
      'Explain the technologies used and your specific contributions.'
    ]
  };

  // Randomly select suggestions to avoid repetition
  if (matchCount < Math.max(1, Math.floor(skills.length / 2))) {
    const skillSugs = suggestionPool.skills;
    suggestions.push(skillSugs[Math.floor(Math.random() * skillSugs.length)]);
  }
  if (years < 1) {
    const expSugs = suggestionPool.experience;
    const randomExp = expSugs[Math.floor(Math.random() * expSugs.length)];
    if (!suggestions.includes(randomExp)) suggestions.push(randomExp);
  }
  if (!eduBonus) {
    const eduSugs = suggestionPool.education;
    const randomEdu = eduSugs[Math.floor(Math.random() * eduSugs.length)];
    if (!suggestions.includes(randomEdu)) suggestions.push(randomEdu);
  }
  if (certBonus === 0) {
    const certSugs = suggestionPool.certifications;
    const randomCert = certSugs[Math.floor(Math.random() * certSugs.length)];
    if (!suggestions.includes(randomCert)) suggestions.push(randomCert);
  }
  if (projectBonus < 5) {
    const projSugs = suggestionPool.projects;
    const randomProj = projSugs[Math.floor(Math.random() * projSugs.length)];
    if (!suggestions.includes(randomProj)) suggestions.push(randomProj);
  }

  // Add dynamic suggestions based on job title
  if (jobTitle.toLowerCase().includes('developer') || jobTitle.toLowerCase().includes('engineer')) {
    if (!lower.includes('git')) {
      suggestions.push('Add version control experience (Git, GitHub) which is essential for development roles.');
    }
  }

  if (jobTitle.toLowerCase().includes('frontend') && !lower.includes('responsive')) {
    suggestions.push('Mention responsive design experience and mobile-first development approaches.');
  }

  if (jobTitle.toLowerCase().includes('backend') && !lower.includes('api')) {
    suggestions.push('Highlight API development experience and database design skills.');
  }

  // Ensure at least some suggestions
  if (suggestions.length === 0) {
    const positiveSuggestions = [
      'Your resume looks good! Consider tailoring it further to specific job requirements.',
      'Great foundation! Focus on quantifying your achievements with metrics.',
      'Solid resume structure! Add more specific examples of your work.',
      'Good start! Include recent projects to showcase current skills.'
    ];
    suggestions.push(positiveSuggestions[Math.floor(Math.random() * positiveSuggestions.length)]);
  }

  // Limit to 3-4 suggestions max
  suggestions.splice(4);

  return {
    score: Math.max(total, 10), // Minimum score of 10
    matchPercent: total,
    suggestions,
    matchCount,
    skillsChecked: skills,
    matched: matchDetails
  };
}

// Also provide default export for compatibility
export default { computeATSScore };
