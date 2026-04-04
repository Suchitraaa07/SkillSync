const { computeReadiness } = require("./readinessService");

const simulateFutureReadiness = async ({
  currentSkills,
  additionalSkills,
  jobSkills,
  projects,
  experienceYears,
  jobDescription,
}) => {
  const mergedSkills = [...new Set([...(currentSkills || []), ...(additionalSkills || [])])];

  return computeReadiness({
    userSkills: mergedSkills,
    jobSkills,
    projects,
    experienceYears,
    jobDescription,
  });
};

module.exports = { simulateFutureReadiness };
