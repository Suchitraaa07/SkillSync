const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const trackerRoutes = require("./routes/trackerRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const interviewRoutes = require("./routes/interviewRoutes");

dotenv.config();

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      const configured = (process.env.CORS_ORIGIN || "http://localhost:3000")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (!origin) return callback(null, true);
      if (origin.startsWith("chrome-extension://")) return callback(null, true);
      if (configured.includes(origin)) return callback(null, true);

      return callback(new Error("CORS policy blocked this origin"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.use("/pdf", pdfRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SkillSync AI backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/", analysisRoutes);
app.use("/", trackerRoutes);
app.use("/", interviewRoutes);

app.use((err, _req, res, _next) => {
  return res.status(500).json({ message: err.message || "Internal server error" });
});

const port = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`SkillSync backend running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect database", error.message);
    process.exit(1);
  });
