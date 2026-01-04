// ✅ Step 0: Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config(); // MUST be first line

// ✅ Core imports
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";

// ✅ Routes
import userRoutes from "./routes/user.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import authRoutes from "./routes/auth.routes.js";

// ✅ Passport config
import "./config/passport.js";

const app = express();
console.log("🚀 Initializing Express app...");

// ✅ Trust proxy for Render
app.set('trust proxy', 1);

// ✅ CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://prepmate-ai-frontend.onrender.com"
];

app.use(cors({
  origin: function(origin, callback) {
    console.log("CORS origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
console.log("✅ CORS configured");

// ✅ Middleware
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  next();
});

// Set timeout for long requests
app.use((req, res, next) => {
  req.setTimeout(120000); // 2 min
  res.setTimeout(180000); // 3 min
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// ✅ Passport initialization
app.use(passport.initialize());
console.log("✅ Middleware configured");

// ✅ Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
console.log("✅ Routes mounted");

// ✅ Health check
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "🚀 PrepMate AI Backend Running Successfully" });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend API is healthy" });
});

// ✅ 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err.message);
  console.error("Stack:", err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

console.log("✅ App initialized successfully");

export default app;
