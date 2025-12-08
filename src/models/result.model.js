// backend/src/models/result.model.js
import mongoose from "mongoose";

const evalSchema = new mongoose.Schema({
  score: { type: Number, default: 0 },
  feedback: { type: String, default: "" }
}, { _id: false });

const ResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobTitle: { type: String, required: true },
  category: { type: String, required: true },
  trEvaluation: { type: [evalSchema], default: [] },
  hrEvaluation: { type: [evalSchema], default: [] },
  trScore: { type: Number, default: 0 },
  hrScore: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Result", ResultSchema);
