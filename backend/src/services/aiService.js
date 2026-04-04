const axios = require("axios");

const getExplainableFeedback = async ({ missingSkills, weakSkills, strongSkills, readiness }) => {
  const fallback = `Readiness is ${readiness.score}%. Missing skills: ${missingSkills.slice(0, 4).join(", ") || "none"}. Improve weak areas (${weakSkills.slice(0, 3).join(", ") || "none"}) and strengthen project depth around your target role.`;

  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a concise career coach for internship readiness.",
          },
          {
            role: "user",
            content: `Generate a 2-3 sentence explanation for readiness score ${readiness.score}. Missing: ${missingSkills.join(", ")}. Weak: ${weakSkills.join(", ")}. Strong: ${strongSkills.join(", ")}.`,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices?.[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    return fallback;
  }
};

const generateInterviewFollowup = async ({ question, answer, score }) => {
  if (!process.env.OPENAI_API_KEY) {
    return `Your answer quality is ${score}/100. Add more concrete metrics and architecture choices for a stronger response.`;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an interview coach. Give concise actionable feedback.",
          },
          {
            role: "user",
            content: `Question: ${question}\nCandidate answer: ${answer}\nScore: ${score}/100\nGive improvement tips in 2 bullets.`,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices?.[0]?.message?.content?.trim() || "Practice clearer structure with STAR method.";
  } catch (error) {
    return "Practice clearer structure with STAR method.";
  }
};

module.exports = {
  getExplainableFeedback,
  generateInterviewFollowup,
};
