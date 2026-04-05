const mongoose = require("mongoose");
const Application = require("../models/Application");

const CREATE_ALLOWED_STATUSES = ["Applied", "Shortlisted", "Interview", "Rejected", "Offer"];
const UPDATE_ALLOWED_STATUSES = ["Applied", "Shortlisted", "Interview", "Rejected", "Offer"];

function sendError(res, error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  return res.status(status).json({ message: error?.message || "Internal server error" });
}

function sanitizeText(value, fieldName) {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }
  return cleaned.slice(0, 120);
}

function sanitizeStatus(value, allowedStatuses) {
  const cleaned = String(value || "").trim();
  if (!allowedStatuses.includes(cleaned)) {
    const error = new Error("Invalid application status");
    error.status = 400;
    throw error;
  }
  return cleaned;
}

function sanitizeDateApplied(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Invalid application date");
    error.status = 400;
    throw error;
  }
  return date;
}

function assertValidObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid application id");
    error.status = 400;
    throw error;
  }
}

const listApplications = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.userId }).sort({
      dateApplied: -1,
      createdAt: -1,
    });

    return res.json({ applications });
  } catch (error) {
    return sendError(res, error);
  }
};

const createApplication = async (req, res) => {
  try {
    const dateApplied = sanitizeDateApplied(req.body?.dateApplied);
    const application = await Application.create({
      userId: req.user.userId,
      company: sanitizeText(req.body?.company, "Company name"),
      role: sanitizeText(req.body?.role, "Role"),
      status: sanitizeStatus(req.body?.status, CREATE_ALLOWED_STATUSES),
      referral: Boolean(req.body?.referral),
      dateApplied,
      appliedAt: dateApplied,
    });

    return res.status(201).json({ application });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateApplication = async (req, res) => {
  try {
    assertValidObjectId(req.params.id);

    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { status: sanitizeStatus(req.body?.status, UPDATE_ALLOWED_STATUSES) },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json({ application });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteApplication = async (req, res) => {
  try {
    assertValidObjectId(req.params.id);

    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
};
