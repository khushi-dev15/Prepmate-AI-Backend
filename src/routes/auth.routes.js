import express from "express";
import passport from "passport";
import { googleOAuthCallback } from "../controllers/auth.controller.js";

const authRouter = express.Router();

// Google OAuth Route - Initiate login
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth Callback - Handle callback from Google
authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/auth?error=Google_auth_failed" }),
  googleOAuthCallback
);

export default authRouter;
