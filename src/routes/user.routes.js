import express from "express";
import { registerController, loginController, getProfileController } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.post("/register", registerController);
router.post("/login", loginController);

router.get('/profile', protect, getProfileController);

export default router;
