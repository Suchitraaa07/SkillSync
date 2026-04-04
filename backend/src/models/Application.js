const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: {
      type: String,
      enum: ["Saved", "Applied", "Interview", "Rejected", "Offer"],
      default: "Saved",
    },
    appliedAt: Date,
    fitScore: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", ApplicationSchema);
