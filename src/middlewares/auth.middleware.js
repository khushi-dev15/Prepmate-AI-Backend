
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // Check for token in cookies first (for cookie-based auth), then Authorization header
  let token = req.cookies?.token;

  if (!token) {
    // Fallback to Authorization header
    token = req.headers.authorization?.split(" ")[1];
  }

  // Fallback extra (mobile / browser privacy restrictions): accept explicit token in query/body
  if (!token) {
    token = req.query?.token || req.body?.token;
  }

  if (!token) {
    console.warn("❌ Auth failed: No token found in cookies or Authorization header");
    console.warn("   Cookies available:", Object.keys(req.cookies || {}));
    console.warn("   Authorization header:", req.headers.authorization ? "Present" : "Missing");
    return res.status(401).json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Handle both 'id' and '_id' patterns
    req.user = decoded;
    console.log("✅ Auth successful for user:", decoded._id);
    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

