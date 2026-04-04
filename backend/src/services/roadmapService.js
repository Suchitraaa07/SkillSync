const ROADMAP_RESOURCES = {
  "node.js": ["Node.js Docs", "Express Crash Course", "REST API mini-project"],
  react: ["React Docs", "Build 5 UI Components", "Deploy a React project"],
  mongodb: ["MongoDB University Basics", "Mongoose guide", "CRUD backend project"],
  python: ["Python for Everybody", "Automate scripts", "Data mini-app"],
  "machine learning": ["Andrew Ng ML", "Scikit-learn projects", "Kaggle practice"],
};

const defaultResources = ["Official docs", "Hands-on mini project", "Mock interview prep"];

const generateRoadmap = (missingSkills = []) => {
  if (!missingSkills.length) {
    return [
      {
        week: 1,
        focusSkill: "Portfolio polish",
        project: "Refine two strongest projects with quantified impact",
        resources: ["GitHub README best practices", "Project presentation checklist"],
      },
    ];
  }

  return missingSkills.slice(0, 8).map((skill, index) => ({
    week: index + 1,
    focusSkill: skill,
    project: `Build a focused mini-project using ${skill}`,
    resources: ROADMAP_RESOURCES[skill] || defaultResources,
  }));
};

module.exports = { generateRoadmap };
