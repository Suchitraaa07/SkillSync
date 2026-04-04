const pdfParseLib = require("pdf-parse");
const {
  extractSkills,
  extractProjects,
  extractExperienceYears,
} = require("./nlpService");

const parsePdfText = async (buffer) => {
  // pdf-parse v1 exported a callable function, while v2 exposes a class API.
  if (typeof pdfParseLib === "function") {
    return pdfParseLib(buffer);
  }

  if (typeof pdfParseLib.default === "function") {
    return pdfParseLib.default(buffer);
  }

  if (pdfParseLib.PDFParse) {
    const parser = new pdfParseLib.PDFParse({ data: buffer });
    try {
      return await parser.getText();
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    }
  }

  throw new Error("Unsupported pdf-parse module format");
};

const parseResumeBuffer = async (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) {
    throw new Error("Invalid resume file");
  }

  // PDF files should start with the %PDF header.
  if (buffer.slice(0, 4).toString("utf8") !== "%PDF") {
    throw new Error("Only valid PDF resumes are supported");
  }

  const parsed = await parsePdfText(buffer);
  const text = parsed.text || "";

  return {
    text,
    skills: extractSkills(text),
    projects: extractProjects(text),
    experienceYears: extractExperienceYears(text),
  };
};

module.exports = { parseResumeBuffer };
