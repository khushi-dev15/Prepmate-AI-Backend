import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    latestResumeId: { type: mongoose.Schema.Types.ObjectId, ref: "Resume" },
    latestJobTitle: { type: String },
    googleId: { type: String },
    profilePicture: { type: String },
    isVerified: { type: Boolean, default: false },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
