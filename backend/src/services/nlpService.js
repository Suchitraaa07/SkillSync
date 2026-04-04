const { WordTokenizer } = require("natural");
const { SKILL_TAXONOMY } = require("./skillTaxonomy");

const tokenizer = new WordTokenizer();

const normalize = (text = "") => text.toLowerCase().replace(/\s+/g, " ").trim();

const dedupe = (arr) => [...new Set(arr.map((v) => normalize(v)).filter(Boolean))];

const extractSkills = (text = "") => {
  const plain = normalize(text);
  const found = SKILL_TAXONOMY.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(plain);
  });

  const tokenizedSkills = tokenizer
    .tokenize(plain)
    .filter((token) => SKILL_TAXONOMY.includes(token));

  return dedupe([...found, ...tokenizedSkills]);
};

const extractProjects = (text = "") => {
  return text
    .split(/\n+/)
    .filter((line) => /project|built|developed|implemented|deployed/i.test(line))
    .map((line) => line.trim())
    .slice(0, 10);
};

const extractExperienceYears = (text = "") => {
  const matches = text.match(/(\d+)\+?\s*(years|yrs|year)/gi) || [];
  if (!matches.length) return 0;

  return matches.reduce((total, fragment) => {
    const value = Number(fragment.match(/\d+/)?.[0] || 0);
    return Math.max(total, value);
  }, 0);
};

module.exports = {
  dedupe,
  extractSkills,
  extractProjects,
  extractExperienceYears,
  normalize,
};
