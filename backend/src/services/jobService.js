const axios = require("axios");
const cheerio = require("cheerio");
const { extractSkills, dedupe } = require("./nlpService");
const { semanticSimilarity } = require("./semanticService");
const { SKILL_TAXONOMY } = require("./skillTaxonomy");

const scrapeJobDescription = async (url) => {
  const { data } = await axios.get(url, { timeout: 15000 });
  const $ = cheerio.load(data);
  return $("body").text().replace(/\s+/g, " ").trim();
};

const inferHiddenSkills = async (jobText, requiredSkills) => {
  const inferred = [];

  for (const skill of SKILL_TAXONOMY) {
    if (requiredSkills.includes(skill)) continue;
    const similarity = await semanticSimilarity(skill, jobText);
    if (similarity > 0.26) inferred.push(skill);
  }

  return dedupe(inferred).slice(0, 15);
};

const analyzeJobDescription = async ({ description, url }) => {
  const jobDescription = description || (url ? await scrapeJobDescription(url) : "");
  if (!jobDescription) {
    throw new Error("Provide either a job description or a valid URL.");
  }

  const requiredSkills = extractSkills(jobDescription);
  const inferredSkills = await inferHiddenSkills(jobDescription, requiredSkills);

  return {
    sourceUrl: url || "",
    jobDescription,
    requiredSkills,
    inferredSkills,
  };
};

module.exports = { analyzeJobDescription };
