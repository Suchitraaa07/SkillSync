const { parsePDF } = require("../services/pdfService");
const { getResumeOptimizationFromText } = require("../services/aiService");
const fs = require("fs/promises");

exports.uploadPDF = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Resume PDF file is required" });
  }

  try {
    const text = await parsePDF(req.file.path);
    let insights = null;
    let warning = null;

    try {
      insights = await getResumeOptimizationFromText({ resumeText: text });
    } catch (insightError) {
      // Do not fail PDF parsing if AI insight generation is unavailable.
      warning = insightError?.message || "Insights unavailable";
    }

    return res.json({ text, insights, warning });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Failed to parse PDF" });
  } finally {
    try {
      await fs.unlink(req.file.path);
    } catch {
      // Best-effort cleanup; ignore if file was already removed.
    }
  }
};
