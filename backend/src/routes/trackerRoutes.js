const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  listApplications,
  createApplication,
  updateApplication,
} = require("../controllers/trackerController");

const router = express.Router();

router.get("/applications", authMiddleware, listApplications);
router.post("/applications", authMiddleware, createApplication);
router.patch("/applications/:id", authMiddleware, updateApplication);

module.exports = router;
