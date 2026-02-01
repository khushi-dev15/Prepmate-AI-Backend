
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // Check for token in cookies first (for cookie-based auth), then Authorization header
  let token = req.cookies?.token;

  if (!token) {
    // Fallback to Authorization header
    token = req.headers.authorization?.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
