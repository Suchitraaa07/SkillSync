const axios = require("axios");

const JOB_CACHE_TTL_MS = 5 * 60 * 1000;
const jobCache = new Map();

const buildFallbackJobs = (role, skills) => {
  const topSkills = skills.slice(0, 4);
  const skillsText = topSkills.length ? `Skills: ${topSkills.join(", ")}.` : "Skills aligned with role requirements.";

  return [
    {
      title: `${role} Intern`,
      company: "Campus Hiring Partner",
      location: "Remote, India",
      applyLink: "https://internshala.com/internships",
      description: `Entry-level internship track for ${role}. ${skillsText}`,
    },
    {
      title: `Junior ${role}`,
      company: "Startup Talent Pool",
      location: "Bengaluru, India",
      applyLink: "https://www.linkedin.com/jobs/",
      description: `Early-career opportunity for ${role} with practical project exposure. ${skillsText}`,
    },
    {
      title: `${role} Trainee`,
      company: "Tech Fellowship Program",
      location: "Hybrid, India",
      applyLink: "https://www.naukri.com/",
      description: `Structured trainee role focused on internships and mentorship. ${skillsText}`,
    },
  ];
};

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => String(skill).trim()).filter(Boolean);
  }
  if (typeof skills === "string") {
    return skills
      .split(/[,\s]+/)
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
  return [];
};

const getJobs = async (req, res) => {
  try {
    const role = String(req.query.role || "").trim();
    const skills = normalizeSkills(req.query.skills);

    if (!role) {
      return res.status(400).json({ message: "role query param is required" });
    }

    if (!process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) {
      return res.status(500).json({ message: "RapidAPI credentials are not configured" });
    }

    const cacheKey = `${role.toLowerCase()}::${skills
      .map((skill) => skill.toLowerCase())
      .sort()
      .join(",")}`;
    const now = Date.now();
    const cached = jobCache.get(cacheKey);
    if (cached && now - cached.timestamp < JOB_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const skillQuery = skills.join(" ");
    const query = `${role} intern ${skillQuery}`.trim();

    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query,
        location: "India",
        num_pages: 1,
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
      },
      timeout: 15000,
    });

    const jobs = Array.isArray(response.data?.data) ? response.data.data : [];
    const simplified = jobs.map((job) => ({
      title: job.job_title || "Untitled role",
      company: job.employer_name || "Unknown company",
      location: [job.job_city, job.job_country].filter(Boolean).join(", ") || "Location not specified",
      applyLink: job.job_apply_link || "",
      description: job.job_description || "",
    }));

    jobCache.set(cacheKey, { timestamp: now, data: simplified });

    return res.json(simplified);
  } catch (error) {
    const statusCode = Number(error?.response?.status) || 500;
    const providerMessage = String(error?.response?.data?.message || error?.message || "");

    if (
      statusCode === 403 ||
      /not subscribed|subscribe|forbidden/i.test(providerMessage)
    ) {
      const role = String(req.query.role || "Intern").trim() || "Intern";
      const skills = normalizeSkills(req.query.skills);
      return res.status(200).json(buildFallbackJobs(role, skills));
    }

    if (statusCode === 429) {
      return res.status(429).json({
        message: "Rate limit reached on job provider. Please try again in a minute.",
      });
    }

    return res.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
      message: error.response?.data?.message || "Failed to fetch jobs from JSearch",
    });
  }
};

module.exports = { getJobs };

