import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "🚀 PrepMate AI Backend Running Successfully" });
});

app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" }));

export default app;
