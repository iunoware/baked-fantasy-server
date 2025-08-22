import CourseVideo from "../models/courseVideos.js";
import express from "express";
import multer from "multer";

const router = express.Router();

// configure multer storage:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save in uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const upload = multer({ storage });

// POST
router.post(
  "/course/course-video",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, duration, serialNum } = req.body;

      if (!title || !duration || !serialNum) {
        return res.status(400).json({ msg: "details are missing" });
      }

      const newCourseVideo = await CourseVideo.create({
        title,
        duration,
        serialNum,
        thumbnail: req.files?.image?.[0]
          ? `/uploads/${req.files.image[0].filename}`
          : "No thumbnail provided",
        videoUrl: req.files?.video?.[0]
          ? `/uploads/${req.files.video[0].filename}`
          : "No video provided",
      });

      res.json({ msg: "success", newCourseVideo });
    } catch (error) {
      res.status(400).json({ msg: "something went wrong", error: error.message });
    }
  }
);

// GET
router.get("/course/course-video", (req, res) => {});

// PATCH
router.patch("/course/course-video/:id", (req, res) => {});

// DELETE
router.delete("/course/course-video/:id", async (req, res) => {
  try {
    const deleted = await CourseVideo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(400).json({ msg: "video not found" });

    res.json({ msg: "video deleted successfully" });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

export default router;
