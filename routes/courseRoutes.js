import Course from "../models/course.js";
import express from "express";
import multer from "multer";

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

// to POST a new course:
router.post("/course", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, duration } = req.body;

    const newCourse = await Course.create({
      title,
      description,
      price,
      thumbnail: req.file ? `/uploads/${req.file.filename}` : "No thumbnail provided",
      duration,
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
    res.json(courses);
  } catch (error) {
    res.status(400).json({ msg: "can't fetch courses", error: error.message });
  }
});

// to PATCH courses:
router.patch("/course/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, description, price, duration } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(400).json({ msg: "course not found" });

    if (title) course.title = title;
    if (description) course.description = description;
    if (price) course.price = price;
    if (req.file) course.thumbnail = `/uploads/${req.file.filename}`;
    if (duration) course.duration = duration;

    await course.save();

    res.json({ msg: "course updated successfully" });
  } catch (error) {
    res.status(400).json({ msg: "can't edit course", error: error.message });
  }
});

// DELETING the course:
router.delete("/course/:id", async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) return res.status(400).json({ msg: "Course not found" });

    res.json({ msg: "Course DELETED successfully" });
  } catch (error) {
    res.status(400).json({ msg: "Failed to delete course", error: error.message });
  }
});

export default router;
