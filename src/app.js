import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import interviewRoutes from "./routes/interview.routes.js"; // import interview routes

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes); // mount interview routes

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "🚀 PrepMate AI Backend Running Successfully" });
});

// 404 for undefined routes
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));

// Global error handler
app.use((err, req, res, next) => 
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" })
);

export default app;
