const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs/promises");
const pdfParseLib = require("pdf-parse");

function parsePDF(filePath) {
  return new Promise((resolve, reject) => {
    const parserPath = path.resolve(__dirname, "pdfParser.py");
    const process = spawn("python", [parserPath, filePath], { shell: false });

    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    process.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    process.on("error", async () => {
      try {
        const fallback = await fallbackParsePDF(filePath);
        resolve(fallback);
      } catch (fallbackError) {
        reject(fallbackError);
      }
    });

    process.on("close", async (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      try {
        const fallback = await fallbackParsePDF(filePath);
        resolve(fallback);
      } catch (fallbackError) {
        reject(
          new Error(
            `pdfplumber parse failed (${stderr.trim() || `exit ${code}`}); fallback parser also failed: ${fallbackError.message}`
          )
        );
      }
    });
  });
}

async function fallbackParsePDF(filePath) {
  const buffer = await fs.readFile(filePath);
  const parsed = await parsePdfText(buffer);
  return (parsed.text || "").trim();
}

async function parsePdfText(buffer) {
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
}

module.exports = { parsePDF };
