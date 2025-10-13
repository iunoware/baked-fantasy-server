// import router from "./routes/courseRoutes.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import express from "express";

const router = express.Router();

async function userVerification(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user; // attach user info to request
    next();
  });
}

router.get("/courses/my-learning", userVerification, async (req, res) => {
  try {
    // const user = await User.findById(req.user.id).populate("purchasedCourses");
    const user = await User.findById(req.user.id).populate({
      path: "purchasedCourses.courseId", // ✅ populate inside nested object
      model: "Course",
    });
    res.json({ courses: user.purchasedCourses });
  } catch (error) {
    res.json({ error: error.message });
  }
});

export default router;
