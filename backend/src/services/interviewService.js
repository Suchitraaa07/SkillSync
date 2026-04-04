const { semanticSimilarity } = require("./semanticService");

const QUESTION_BANK = {
  "web dev": [
    "Explain how React reconciliation works.",
    "How would you design a scalable REST API?",
    "What is the difference between SSR and CSR in Next.js?",
  ],
  "ml engineer": [
    "How do you handle overfitting in a model?",
    "Explain precision vs recall with an example.",
    "How would you deploy an ML model for production inference?",
  ],
  "data analyst": [
    "How would you clean noisy tabular data?",
    "Explain a dashboard you built and impact created.",
    "How do you choose between mean and median?",
  ],
};

const getQuestionsForRole = (role = "web dev") => {
  const key = role.toLowerCase();
  return QUESTION_BANK[key] || QUESTION_BANK["web dev"];
};

const scoreAnswer = async ({ question, answer }) => {
  const qualitySimilarity = await semanticSimilarity(question, answer || "");
  const lengthFactor = Math.min((answer || "").split(" ").filter(Boolean).length / 40, 1);
  const score = Math.round((qualitySimilarity * 0.7 + lengthFactor * 0.3) * 100);
  return Math.max(0, Math.min(score, 100));
};

module.exports = { getQuestionsForRole, scoreAnswer };
