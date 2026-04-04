const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

const router = express.Router();

router.use(authMiddleware);

router.route("/").get(listApplications).post(createApplication);
router.route("/:id").put(updateApplication).delete(deleteApplication);

module.exports = router;
