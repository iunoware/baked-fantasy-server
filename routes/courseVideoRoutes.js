import CourseVideo from "../models/courseVideos.js";
import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

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

/* 
// For POST & GET:
await axios.post( `http://localhost:5000/course/${courseId}/video`);

// for PATCH & DELETE:
await axios.post( `http://localhost:5000/course/${courseId}/video/${videoId}`);
*/

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

// POST
router.post(
  "/course/:id/video",
  verifyAdmin,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, duration, serialNum, description } = req.body;

      if (!title || !duration || !serialNum || !description) {
        return res.status(400).json({ msg: "details are missing" });
      }

      const newCourseVideo = await CourseVideo.create({
        title,
        duration,
        serialNum,
        description,
        category: req.params.id,
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
router.get("/course/:id/video", verifyAdmin, async (req, res) => {
  try {
    const allCourseVideos = await CourseVideo.find();
    if (!allCourseVideos)
      return res.status(400).json({ msg: "Can't find course videos" });

    res.json({ total_videos: allCourseVideos.length, allCourseVideos });
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
});

// GET single video
router.get("/course/:courseId/video/:videoId", verifyAdmin, async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    const currentVideo = await CourseVideo.findById(videoId);
    if (!currentVideo) return res.status(400).json({ msg: "video not found" });

    res.json(currentVideo);
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
});

// PATCH
router.patch(
  "/course/:courseId/video/:videoId",
  verifyAdmin,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { courseId, videoId } = req.params;
      const { title, duration, serialNum, description } = req.body;

      const currentVideo = await CourseVideo.findById(videoId);
      if (!currentVideo) return res.status(400).json({ msg: "video not found!" });

      if (title) currentVideo.title = title;
      if (duration) currentVideo.duration = duration;
      if (serialNum) currentVideo.serialNum = serialNum;
      if (description) currentVideo.description = description;
      if (req.files?.image?.[0]) {
        currentVideo.thumbnail = `/uploads/${req.files.image[0].filename}`;
      }
      if (req.files?.video?.[0]) {
        currentVideo.videoUrl = `/uploads/${req.files.video[0].filename}`;
      }

      currentVideo.save();

      res.json({ msg: "Video updated successfully", currentVideo });
    } catch (error) {
      res.status(400).json({ msg: "something went wrong", error: error.message });
    }
  }
);

// DELETE
router.delete("/course/:courseId/video/:videoId", verifyAdmin, async (req, res) => {
  try {
    const { courseId, videoId } = req.params;
    const deleted = await CourseVideo.findByIdAndDelete(videoId);
    if (!deleted) return res.status(400).json({ msg: "video not found" });

    res.json({ msg: "video deleted successfully" });
  } catch (error) {
    res.status(400).json(error.message);
  }
});

export default router;
