import OfflineCourse from "../models/offlineCourse.js";
import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save in uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const upload = multer({ storage });

async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1]?.trim();
    // console.log("Authorization header:", req.headers.authorization);
    // console.log("Token extracted:", token);

    if (!token) return res.status(401).json({ msg: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded ID:", decoded.id);

    const user = await User.findById(decoded.id);
    console.log("user: ", user);
    console.log("user role: ", user.role);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "access denied" });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
}

router.post("/offline-course", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;

    const newCourse = await OfflineCourse.create({
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "No thumbnail provided",
      title,
      description,
      highlights: req.body.highlights ? JSON.parse(req.body.highlights) : [],
    });
    res.json({ msg: "offline course created successfully", newCourse });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/offline-course", async (req, res) => {
  try {
    const courses = await OfflineCourse.find();
    if (!courses) {
      return res.status(400).json({ msg: "can't find the offline courses" });
    }

    res.json({ courses });
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
});

export default router;
