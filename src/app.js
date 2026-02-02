import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

// Routes
import userRoutes from "./routes/user.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import authRoutes from "./routes/auth.routes.js";

// Passport config
import "./config/passport.js";

const app = express();

// ✅ Trust proxy (REQUIRED for Render cookies)
app.set("trust proxy", 1);

// ✅ CORS – SIMPLE & CORRECT
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://prepmate-ai-frontend.onrender.com",
    ],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "🚀 PrepMate AI Backend Running" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend healthy" });
});

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ❌ Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message });
});

export default app;
