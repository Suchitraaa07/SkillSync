const express = require("express");
const multer = require("multer");
const { authMiddleware } = require("../middleware/auth");
const {
  uploadResume,
  analyzeJob,
  getSkillGap,
  getReadinessScore,
  getRoadmap,
  simulateFuture,
  getFitHeatmap,
  resumeOptimizer,
  extensionAnalyze,
} = require("../controllers/analysisController");
const { interview } = require("../controllers/interviewController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-resume", authMiddleware, upload.single("resume"), uploadResume);
router.post("/analyze-job", authMiddleware, analyzeJob);
router.get("/skill-gap", authMiddleware, getSkillGap);
router.get("/readiness-score", authMiddleware, getReadinessScore);
router.get("/roadmap", authMiddleware, getRoadmap);
router.post("/simulate-future", authMiddleware, simulateFuture);
router.get("/fit-heatmap", authMiddleware, getFitHeatmap);
router.get("/resume-optimize", authMiddleware, resumeOptimizer);
router.post("/interview", authMiddleware, interview);

router.post("/extension/analyze", extensionAnalyze);

module.exports = router;
