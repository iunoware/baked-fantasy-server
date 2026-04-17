import jwt from "jsonwebtoken";

const verifyAdmin = (req, res, next) => {
  // Try to get token from cookie first, then fall back to header
  const token = req.cookies.authToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ msg: "invalid or expired token" });
  }
};

export default verifyAdmin;
