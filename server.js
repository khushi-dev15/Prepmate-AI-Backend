import config from "./src/config/config.js";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";

// ✅ Connect to MongoDB and Start Server
(async () => {
  try {
    await connectDB(); // Connects using config.MONGODB_URI
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`✅ Server running on port ${port}`));
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
})();
