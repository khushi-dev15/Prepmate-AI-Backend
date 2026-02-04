import express from "express";
import { verifyToken, loginUser, registerUser } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const authRouter = express.Router();

console.log("📍 Auth routes initializing...");

// ✅ Login route
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // ✅ Set cookie for Render deployment
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only
      sameSite: "none", // allow cross-site cookies
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    res.status(200).json({ success: true, user: result.user });
  } catch (err) {
    next(err);
  }
});

// ✅ Register route
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const result = await registerUser({ email, password, name });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // ✅ Set cookie for Render deployment
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24,
    });

    res.status(201).json({ success: true, user: result.user });
  } catch (err) {
    next(err);
  }
});

// ✅ Verify JWT Token - For persistent login
authRouter.get("/verify", protect, verifyToken);

console.log("✅ Auth routes initialized");

export default authRouter;
