import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    console.log("➡️ [Auth] Incoming authorization header:", token);

    if (!token) {
      console.log("❌ [Auth] Failed: No Token Provided in header");
      return res.status(401).json({ message: "No Token Provided" });
    }

    if (!token.startsWith("Bearer ")) {
       console.log("❌ [Auth] Failed: Token is missing 'Bearer ' prefix");
       // Keeping it flexible though
    }

    const realToken = token.split(" ")[1];
    console.log("➡️ [Auth] Extracted realToken:", realToken);

    if (!realToken || realToken === "null") {
      console.log("❌ [Auth] Failed: Token is missing (user likely not logged in)");
      return res.status(401).json({ message: "Authentication missing. Please log in again." });
    }

    const decoded = jwt.verify(realToken, process.env.JWT_SECRET);
    console.log("➡️ [Auth] Decoded token payload:", decoded);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ [Auth] Failed: User not found for ID:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ [Auth] Success! User authenticated:", user.email);
    req.user = user;

    next();
  } catch (error) {
    console.error("❌ [Auth] Failed: jwt.verify error block triggered:", error.message);
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

export default authMiddleware;
