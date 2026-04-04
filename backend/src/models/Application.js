const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 120 },
    status: {
      type: String,
      enum: ["Saved", "Applied", "Shortlisted", "Interview", "Rejected", "Offer"],
      default: "Applied",
    },
    referral: { type: Boolean, default: false },
    dateApplied: { type: Date, default: Date.now, index: true },
    appliedAt: Date,
    fitScore: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

ApplicationSchema.index({ userId: 1, dateApplied: -1, createdAt: -1 });

module.exports = mongoose.model("Application", ApplicationSchema);
