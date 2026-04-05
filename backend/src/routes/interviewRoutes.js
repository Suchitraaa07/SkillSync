const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { evaluateInterview } = require("../controllers/interviewEvaluationController");

const router = express.Router();

router.post("/api/interview/evaluate", authMiddleware, evaluateInterview);

module.exports = router;
