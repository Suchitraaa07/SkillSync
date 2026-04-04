const { getQuestionsForRole, scoreAnswer } = require("../services/interviewService");
const { generateInterviewFollowup } = require("../services/aiService");

const interview = async (req, res) => {
  try {
    const { role = "web dev", question, answer } = req.body;

    if (!question) {
      return res.json({ questions: getQuestionsForRole(role) });
    }

    const score = await scoreAnswer({ question, answer: answer || "" });
    const feedback = await generateInterviewFollowup({ question, answer: answer || "", score });

    return res.json({ score, feedback });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Interview evaluation failed" });
  }
};

module.exports = { interview };
