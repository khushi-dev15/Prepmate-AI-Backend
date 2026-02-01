import express from "express";
import { registerController, loginController, getProfileController, logoutController } from "../controllers/user.controller.js";
import { forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/register", registerController);
router.post("/login", loginController);
router.post("/logout", logoutController);

router.get('/profile', protect, getProfileController);

// Password reset routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
