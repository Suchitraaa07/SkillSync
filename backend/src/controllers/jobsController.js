const axios = require("axios");

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

    return res.json(simplified);
  } catch (error) {
    return res.status(500).json({
      message: error.response?.data?.message || "Failed to fetch jobs from JSearch",
    });
  }
};

module.exports = { getJobs };

