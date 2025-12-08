import config from "./src/config/config.js";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";
import cors from "cors";

// ✅ Step 1: CORS Setup
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Local frontend
      "https://your-frontend-domain.com" // Replace with live frontend URL
    ],
    credentials: true
  })
);

// ✅ Step 2: Connect to MongoDB and Start Server
(async () => {
  try {
    await connectDB(); // Connects using config.MONGODB_URI
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`✅ Server running on port ${port}`));
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
})();
