import dotenv from "dotenv";
dotenv.config({ path: "./.env" });


import fs from "fs";
console.log("ENV FILE FOUND:", fs.existsSync("./.env"));

import config from "./src/config/config.js";
import app from "./src/app.js";
import connectDB from "./src/db/db.js";


(async () => {
  try {
    await connectDB(); // uses process.env.MONGODB_URI internally
    const port = process.env.PORT || 5000;
    app.listen(port, () =>
      console.log(`✅ Server running on port ${port}`)
    );
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
})();
