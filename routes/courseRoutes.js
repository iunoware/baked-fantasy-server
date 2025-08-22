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
router.post(
  "/course",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, price, duration } = req.body;

      const videoFile = req.files["video"] ? req.files["video"][0] : null;
      const imageFile = req.files["image"] ? req.files["image"][0] : null;

      const newCourse = await Course.create({
        title,
        description,
        price,
        thumbnail: imageFile ? `/uploads/${imageFile.filename}` : "No thumbnail provided",
        duration,
        videoUrl: videoFile ? `/uploads/${videoFile.filename}` : "No video provided!",
      });
      res.json({ msg: "course created successfully", newCourse });
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
);

export default router;
