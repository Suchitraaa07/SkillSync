const { parsePDF } = require("../services/pdfService");
const { getResumeOptimizationFromText } = require("../services/aiService");
const fs = require("fs/promises");

exports.uploadPDF = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Resume PDF file is required" });
  }

  try {
    const text = await parsePDF(req.file.path);
    const insights = await getResumeOptimizationFromText({ resumeText: text });
    return res.json({ text, insights });
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
