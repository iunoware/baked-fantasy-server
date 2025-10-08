import Course from "../models/course.js";
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

// for admin verification:
async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1]?.trim();
    // console.log("Authorization header:", req.headers.authorization);
    // console.log("Token extracted:", token);

    if (!token) return res.status(401).json({ msg: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded ID:", decoded.id);

    const user = await User.findById(decoded.id);
    // console.log(user);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "access denied" });
    }
    res.user = user;
    next();
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
}

// to POST a new course:
router.post("/course", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const {
      rating,
      reviews,
      title,
      description,
      totalHours,
      totalVideos,
      price,
      originalPrice,
    } = req.body;

    const newCourse = await Course.create({
      ImageUrl: req.file ? `/uploads/${req.file.filename}` : "No thumbnail provided",
      rating,
      reviews,
      title,
      description,
      totalHours,
      totalVideos,
      highlights: req.body.highlights ? JSON.parse(req.body.highlights) : [],
      price,
      originalPrice,
    });
    res.json({ msg: "course created successfully", newCourse });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// to GET all courses:
router.get("/course", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json({ length: courses.length, courses });
  } catch (error) {
    res.status(400).json({ msg: "can't fetch courses", error: error.message });
  }
});

// GET single course:
router.get("/course/:id", async (req, res) => {
  try {
    const currentCourse = await Course.findById(req.params.id);
    if (!currentCourse) {
      return res.status(400).json({ msg: "can't find the particular course" });
    }

    res.json(currentCourse);
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
});

// to PATCH courses:
router.patch("/course/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    // const { title, description, price, duration } = req.body;

    // const course = await Course.findById(req.params.id);

    // if (title) course.title = title;
    // if (description) course.description = description;
    // if (price) course.price = price;
    // if (req.file) course.thumbnail = `/uploads/${req.file.filename}`;
    // if (duration) course.duration = duration;

    // await course.save();

    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(400).json({ msg: "course not found" });

    res.json({ msg: "course updated successfully" });
  } catch (error) {
    res.status(400).json({ msg: "can't edit course", error: error.message });
  }
});

// DELETING the course:
router.delete("/course/:id", verifyAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) return res.status(400).json({ msg: "Course not found" });

    res.json({ msg: "Course DELETED successfully" });
  } catch (error) {
    res.status(400).json({ msg: "Failed to delete course", error: error.message });
  }
});

export default router;
