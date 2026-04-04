const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const clampScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const calculateOverallInterviewScore = ({ technicalScore, communicationScore, confidenceScore }) => {
  return Math.round(
    technicalScore * 0.5 +
      communicationScore * 0.3 +
      confidenceScore * 0.2
  );
};

const calculateReadinessScore = ({ previousReadiness, overallInterviewScore }) => {
  const previous = Number.isFinite(Number(previousReadiness)) ? Number(previousReadiness) : 0;
  return Math.round(previous * 0.8 + overallInterviewScore * 0.2);
};

const buildPrompt = ({ question, answer }) => {
  return [
    "Evaluate this interview answer.",
    `Question: ${question}`,
    `Answer: ${answer}`,
    "Return strictly valid JSON with these keys:",
    "technicalScore (number 0-100)",
    "communicationScore (number 0-100)",
    "confidenceScore (number 0-100)",
    "feedback (string, detailed and actionable)",
    "No markdown, no code fences, no extra keys.",
  ].join("\n");
};

const parseEvaluationJson = (rawText) => {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

    try {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
};

const fallbackEvaluation = ({ question, answer }) => {
  const answerLength = (answer || "").trim().split(/\s+/).filter(Boolean).length;
  const technicalScore = clampScore(Math.min(85, 40 + answerLength));
  const communicationScore = clampScore(Math.min(90, 45 + Math.floor(answerLength * 0.8)));
  const confidenceScore = clampScore(Math.min(88, 42 + Math.floor(answerLength * 0.7)));

  return {
    technicalScore,
    communicationScore,
    confidenceScore,
    feedback: `Your answer to "${question}" shows promise. Improve by adding concrete system choices, measurable outcomes, and a clearer beginning-middle-end structure.`,
  };
};

const streamOpenAIEvaluation = async ({ question, answer, onToken }) => {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackEvaluation({ question, answer });
  }

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      stream: true,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are a strict interview evaluator. Always return only raw JSON.",
        },
        {
          role: "user",
          content: buildPrompt({ question, answer }),
        },
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("OpenAI streaming request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    pending += decoder.decode(value, { stream: true });
    const lines = pending.split("\n");
    pending = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;

      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const parsed = JSON.parse(payload);
        const token = parsed.choices?.[0]?.delta?.content || "";
        if (!token) continue;

        fullText += token;
        onToken(token);
      } catch {
        // Ignore malformed partial chunks from upstream stream framing.
      }
    }
  }

  const parsedEvaluation = parseEvaluationJson(fullText);
  if (!parsedEvaluation) {
    return fallbackEvaluation({ question, answer });
  }

  return {
    technicalScore: clampScore(parsedEvaluation.technicalScore),
    communicationScore: clampScore(parsedEvaluation.communicationScore),
    confidenceScore: clampScore(parsedEvaluation.confidenceScore),
    feedback:
      typeof parsedEvaluation.feedback === "string" && parsedEvaluation.feedback.trim()
        ? parsedEvaluation.feedback.trim()
        : fallbackEvaluation({ question, answer }).feedback,
  };
};

module.exports = {
  streamOpenAIEvaluation,
  calculateOverallInterviewScore,
  calculateReadinessScore,
  clampScore,
};
