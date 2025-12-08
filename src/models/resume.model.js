import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
  // allow anonymous uploads (optional user) so frontend can upload before login
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    originalName: { type: String, required: true },
    path: { type: String, required: true },
    mimetype: { type: String },
    jobTitleRequested: { type: String },
    analysis: {
      atsScore: Number,
      matchPercent: Number,
      suggestions: [String],
      recommendedNext: [String],
    },
  },
  { timestamps: true }
);

export const Resume = mongoose.model("Resume", resumeSchema);
