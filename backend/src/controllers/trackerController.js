const Application = require("../models/Application");

const listApplications = async (req, res) => {
  const apps = await Application.find({ userId: req.user.userId }).sort({ createdAt: -1 });
  return res.json({ applications: apps });
};

const createApplication = async (req, res) => {
  const payload = { ...req.body, userId: req.user.userId };
  const app = await Application.create(payload);
  return res.status(201).json({ application: app });
};

const updateApplication = async (req, res) => {
  const app = await Application.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.userId },
    req.body,
    { new: true }
  );

  if (!app) return res.status(404).json({ message: "Application not found" });
  return res.json({ application: app });
};

module.exports = {
  listApplications,
  createApplication,
  updateApplication,
};
