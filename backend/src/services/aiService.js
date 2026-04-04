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

const getResumeOptimizationFromText = async ({ resumeText }) => {
  const fallback = buildFallbackResumeOptimization(resumeText);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const trimmedText = (resumeText || "").slice(0, 14000);
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are an expert resume reviewer. Return only valid JSON with fields: summary (string), lacking (string[]), improvements (string[]), optimized_resume_markdown (string). Keep arrays concise and practical for early-career candidates.",
          },
          {
            role: "user",
            content: `Analyze this resume text and provide what is lacking, how to improve, and a stronger optimized resume draft:\n\n${trimmedText}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim() || "";
    const parsed = safeParseJson(raw);
    if (!parsed) return fallback;

    return {
      summary: parsed.summary || fallback.summary,
      lacking: normalizeStringArray(parsed.lacking, fallback.lacking),
      improvements: normalizeStringArray(parsed.improvements, fallback.improvements),
      optimizedResumeMarkdown:
        typeof parsed.optimized_resume_markdown === "string" && parsed.optimized_resume_markdown.trim()
          ? parsed.optimized_resume_markdown.trim()
          : fallback.optimizedResumeMarkdown,
      source: "openai",
    };
  } catch (_error) {
    return fallback;
  }
};

const generateQuestions = async (role, skills = []) => {
  const fallback = buildFallbackQuestions(role, skills);
  if (!process.env.OPENAI_API_KEY) return fallback;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "You generate interview questions for interns. Return strict JSON with key questions. The array must have exactly 3 items: one technical, one project-based, one conceptual. Each item must include id, type ('text' or 'mcq'), category, question, and options (string[] only when type is 'mcq').",
          },
          {
            role: "user",
            content: `Role: ${role}\nCandidate skills: ${skills.join(", ") || "none"}\nGenerate exactly 3 focused interview questions.`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.choices?.[0]?.message?.content?.trim() || "";
    const parsed = safeParseJson(raw);
    if (!parsed?.questions || !Array.isArray(parsed.questions)) return fallback;

    const normalized = parsed.questions
      .slice(0, 3)
      .map((item, index) => ({
        id: String(item.id || `q${index + 1}`),
        type: item.type === "mcq" ? "mcq" : "text",
        category: String(item.category || (index === 0 ? "technical" : index === 1 ? "project" : "conceptual")),
        question: String(item.question || "").trim(),
        options:
          item.type === "mcq" && Array.isArray(item.options)
            ? item.options.map((opt) => String(opt)).filter(Boolean).slice(0, 5)
            : undefined,
      }))
      .filter((q) => q.question);

    if (normalized.length < 3) return fallback;
    return normalized;
  } catch (_error) {
    return fallback;
  }
};

const safeParseJson = (value) => {
  if (!value) return null;
  const direct = tryParse(value);
  if (direct) return direct;

  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return tryParse(fenced[1].trim());
  return null;
};

const tryParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeStringArray = (value, fallback) => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
  return cleaned.length ? cleaned : fallback;
};

const buildFallbackResumeOptimization = (resumeText = "") => {
  const lower = resumeText.toLowerCase();
  const lacking = [];
  if (!/project|projects/.test(lower)) lacking.push("Projects section with role-relevant work is missing or too weak.");
  if (!/\d+%|\d+\s*(users|ms|sec|seconds|days|weeks|months)/.test(lower)) {
    lacking.push("Impact metrics are limited (percentages, scale, latency, user counts).");
  }
  if (!/github|portfolio|linkedin/.test(lower)) lacking.push("Professional links (GitHub/portfolio/LinkedIn) are missing.");
  if (!/skills/.test(lower)) lacking.push("Dedicated skills section is not clearly visible.");

  const improvements = [
    "Start each experience bullet with strong action verbs and keep each bullet to one measurable outcome.",
    "Group technical skills by category: Languages, Frameworks, Tools, Databases, Cloud.",
    "Tailor keywords to the target role and mirror terms from job descriptions.",
    "Move the strongest projects higher and add one line on business/user impact for each.",
  ];

  return {
    summary: "Resume baseline is good, but stronger metrics, role-aligned keywords, and clearer section hierarchy can significantly improve shortlist chances.",
    lacking: lacking.length ? lacking : ["More quantified achievements and stronger project outcomes are needed."],
    improvements,
    optimizedResumeMarkdown: `## Professional Summary\nResult-driven student developer with hands-on project experience in web applications and data workflows. Focused on shipping measurable improvements, clean architecture, and collaborative delivery.\n\n## Skills\n- Languages: JavaScript, TypeScript, Python, SQL\n- Frameworks: React, Next.js, Node.js, Express\n- Tools: Git, Postman, Docker\n- Databases: MongoDB, PostgreSQL\n\n## Projects\n### Project Name\n- Built and deployed a feature that improved task completion by 28% across 1,200+ sessions.\n- Optimized API and caching logic, reducing average response time by 35%.\n- Added test coverage and monitoring, cutting regression incidents by 40%.\n\n## Experience\n### Role, Company\n- Implemented end-to-end feature delivery from requirement to production deployment.\n- Collaborated with cross-functional peers to prioritize roadmap items and fix critical bugs.\n- Produced reusable components and documentation to improve team velocity.\n\n## Education\n- Degree, Institute, Year\n\n## Links\n- GitHub: ...\n- LinkedIn: ...`,
    source: "fallback",
  };
};

const buildFallbackQuestions = (role, skills = []) => {
  const primarySkill = skills[0] || "core programming";
  return [
    {
      id: "q1",
      type: "text",
      category: "technical",
      question: `For a ${role}, explain how you would solve a DSA-style problem using ${primarySkill}. Focus on approach and time complexity.`,
    },
    {
      id: "q2",
      type: "text",
      category: "project",
      question: `Describe one project where you used ${skills.slice(0, 3).join(", ") || "relevant tools"} and explain your personal contribution and impact.`,
    },
    {
      id: "q3",
      type: "mcq",
      category: "conceptual",
      question: `Which practice best improves code quality for a ${role}?`,
      options: [
        "Write tests and review edge cases before shipping",
        "Skip testing if code works locally",
        "Push directly without peer review",
        "Avoid documentation to save time",
      ],
    },
  ];
};

module.exports = {
  getExplainableFeedback,
  generateInterviewFollowup,
  getResumeOptimizationFromText,
  generateQuestions,
};
