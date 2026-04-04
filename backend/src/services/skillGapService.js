const { dedupe } = require("./nlpService");

const buildSkillGap = (userSkills, jobSkills) => {
  const normalizedUser = dedupe(userSkills);
  const normalizedJob = dedupe(jobSkills);

  const strongSkills = normalizedJob.filter((skill) => normalizedUser.includes(skill));
  const missingSkills = normalizedJob.filter((skill) => !normalizedUser.includes(skill));

  const weakSkills = missingSkills.slice(0, Math.ceil(missingSkills.length / 2));

  return {
    strongSkills,
    weakSkills,
    missingSkills,
  };
};

module.exports = { buildSkillGap };
