import express from "express";
import { verifyToken } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

console.log("📍 Auth routes initializing...");

// Verify JWT Token - For persistent login
authRouter.get("/verify", protect, verifyToken);

console.log("✅ Auth routes initialized");

export default authRouter;
