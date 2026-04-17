import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.authToken;
  console.log("All cookies:", req.cookies); // add this
  console.log("Token:", token);

  try {
    // Read token from cookie instead of Authorization header
    const token = req.cookies.authToken;
    console.log("➡️ [Auth] Incoming cookie token:", token);

    if (!token) {
      console.log(" [Auth] Failed: No Token Provided in cookie");
      return res.status(401).json({ message: "Not authenticated" });
    }

    // No need to check for "Bearer " prefix with cookies
    // Cookie value is just the token directly

    if (token === "null" || token === "undefined") {
      console.log(
        " [Auth] Failed: Token is invalid (user likely not logged in)",
      );
      //   return res
      //     .status(401)
      //     .json({ message: "Authentication missing. Please log in again." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("➡️ [Auth] Decoded token payload:", decoded);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ [Auth] Failed: User not found for ID:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    // console.log("✅ [Auth] Success! User authenticated:", user.email);
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

export default authMiddleware;
