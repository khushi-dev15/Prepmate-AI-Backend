import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
  jobTitle: { type: String },
  round: { type: String },
  questions: [{ question: String, answer: String, score: Number, feedback: String }]
}, { timestamps: true });

export default mongoose.model("Attempt", attemptSchema);
