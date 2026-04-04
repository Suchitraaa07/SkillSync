const express = require("express");
const {
	login,
	signup,
	me,
	updateProfiles,
	getProfileIntelligence,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.patch("/profiles", authMiddleware, updateProfiles);
router.get("/profile-intelligence", authMiddleware, getProfileIntelligence);

module.exports = router;
