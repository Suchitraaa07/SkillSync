const express = require("express");
const router = express.Router();
const { uploadPDF } = require("../controllers/pdfController");
const upload = require("../middleware/upload");

router.post("/upload", upload.single("resume"), uploadPDF);

module.exports = router;
