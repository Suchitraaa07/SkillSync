const SKILL_KEYWORDS = [
  "Java",
  "Python",
  "C++",
  "HTML",
  "CSS",
  "JavaScript",
  "React",
  "Node",
  "DBMS",
  "SQL",
  "DSA",
  "OOP",
  "Git",
];

const PROJECT_HINTS_REGEX = /\b(project|projects|developed|built|application|applications)\b/gi;
const EXPERIENCE_HINTS_REGEX = /\b(intern|internship|experience|worked at)\b/i;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseResumeData(text = "") {
  const normalizedText = String(text || "");
  const lowerText = normalizedText.toLowerCase();

  const skills = SKILL_KEYWORDS.filter((skill) => {
    const pattern = new RegExp(`\\b${escapeRegex(skill.toLowerCase())}\\b`, "i");
    return pattern.test(lowerText);
  });

  const projectMatches = normalizedText.match(PROJECT_HINTS_REGEX) || [];
  const projects = projectMatches.length;
  const experience = EXPERIENCE_HINTS_REGEX.test(lowerText);

  console.log("[parseResumeData] Extracted skills:", skills);
  console.log("[parseResumeData] Project count:", projects);

  return {
    skills: [...new Set(skills)],
    projects,
    experience,
  };
}

module.exports = { parseResumeData };

