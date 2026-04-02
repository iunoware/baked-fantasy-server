// this is the new courseRoute, the courseVideoRoutes.js is now useless

import express from "express";
import Course from "../models/course.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
// const upload = multer({ storage });

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "video") {
      if (!file.mimetype.startsWith("video/")) {
        return cb(new Error("Only video files allowed"), false);
      }
    }

    if (file.fieldname === "pdf") {
      if (file.mimetype !== "application/pdf") {
        return cb(new Error("Only PDF allowed"), false);
      }
    }

    if (file.fieldname === "thumbnail") {
      if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only images allowed"), false);
      }
    }

    cb(null, true);
  },
});

// authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // "Bearer <token>"

  if (!token) return res.status(401).json({ msg: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ msg: "Invalid token" });
  }
}

// post a course
router.post("/course", upload.single("thumbnail"), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      discountedPrice,
      originalPrice,
      language,
      duration,
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !discountedPrice ||
      !originalPrice ||
      !duration
    ) {
      return res.status(400).json({
        msg: "Title, description, category, discounted price, original price and duration are required",
      });
    }

    const discountedPriceNum = Number(discountedPrice);
    const originalPriceNum = Number(originalPrice);

    if (isNaN(discountedPriceNum) || isNaN(originalPriceNum)) {
      return res.status(400).json({ msg: "Price must be a number" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "Thumbnail is required" });
    }

    const newCourse = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      thumbnail: `/uploads/${req.file.filename}`,
      discountedPrice: discountedPriceNum,
      originalPrice: originalPriceNum,
      duration: duration.trim(),
      language: language?.trim() || undefined,
      sections: [],
    });

    res.status(201).json({
      msg: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to create course",
      error: error.message,
    });
  }
});

// post sections
router.post("/course/:courseId/section", async (req, res) => {
  try {
    const { title, order } = req.body;

    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ msg: "course not found" });
    }

    // if (!title || !order) {
    if (!title || order === undefined) {
      return res.status(404).json({ msg: "title and order are required" });
    }

    course.sections.push({ title, order, lessons: [] });

    await course.save();

    res.json({ msg: "Section added", course });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

// add videos
router.post(
  "/course/:courseId/section/:sectionId/lesson",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, duration, order } = req.body;

      if (!title || order === undefined) {
        return res.status(400).json({ msg: "title and order are required" });
      }

      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "course not found" });

      const section = course.sections.id(req.params.sectionId);
      if (!section) return res.status(404).json({ msg: "section not found" });

      if (!req.files?.video?.[0]) {
        return res.status(400).json({ msg: "Video is required" });
      }

      section.lessons.push({
        title,
        duration,
        order,
        // videoUrl: req.files?.video?.[0] ? `/uploads/${req.files.video[0].filename}` : null,
        // videoUrl: `/uploads/${req.files.video[0].filename}`,
        videoUrl: req.files.video[0].filename,
        // pdfUrl: req.files?.pdf?.[0] ? `/uploads/${req.files.pdf[0].filename}` : null,
        pdfUrl: req.files?.pdf?.[0]?.filename || null,
      });

      await course.save();

      res.json({ msg: "Lesson added successfully", course });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },
);

// video security
// router.get("/video/:filename", async (req, res) => {
//   try {
//     const { filename } = req.params;

//     const token = req.query.token;

//     if (!token) return res.status(401).json({ msg: "No token" });

//     // if (!req.user) return res.status(401).json({ msg: "Unauthorized" });

//     const filePath = path.join(process.cwd(), "uploads", filename);

//     if (!filePath.startsWith(path.join(process.cwd(), "uploads"))) {
//       return res.status(403).json({ msg: "Forbidden" });
//     }

//     if (!fs.existsSync(filePath)) {
//       return res.status(404).json({ msg: "File not found" });
//     }

//     const stat = fs.statSync(filePath);
//     const fileSize = stat.size;
//     const range = req.headers.range;

//     if (range) {
//       // STREAM (important for video players)
//       const parts = range.replace(/bytes=/, "").split("-");
//       const start = parseInt(parts[0], 10);
//       const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

//       const chunkSize = end - start + 1;

//       const file = fs.createReadStream(filePath, { start, end });

//       res.writeHead(206, {
//         "Content-Range": `bytes ${start}-${end}/${fileSize}`,
//         "Accept-Ranges": "bytes",
//         "Content-Length": chunkSize,
//         "Content-Type": "video/mp4",
//       });

//       file.pipe(res);
//     } else {
//       res.writeHead(200, {
//         "Content-Length": fileSize,
//         "Content-Type": "video/mp4",
//       });

//       fs.createReadStream(filePath).pipe(res);
//     }
//   } catch (err) {
//     res.status(500).json({ msg: err.message });
//   }
// });

router.get("/video/:filename", authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;

    // Prevent path traversal
    const filePath = path.resolve(process.cwd(), "uploads", path.basename(filename));

    if (!filePath.startsWith(path.join(process.cwd(), "uploads"))) {
      return res.status(403).json({ msg: "Forbidden" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ msg: "File not found" });
    }

    // Disable caching so the URL can't be reused
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", "inline");

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Content-Type": "video/mp4",
    });

    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// PDF download
router.get("/download", (req, res) => {
  const filePath = req.query.file;

  if (!filePath) {
    return res.status(400).json({ msg: "File path required" });
  }

  const safePath = path.join(process.cwd(), "uploads", filePath);

  if (!safePath.startsWith(path.join(process.cwd(), "uploads"))) {
    return res.status(403).json({ msg: "You can't access this file" });
  }

  // res.download(safePath);

  // const fullPath = `.${filePath}`;
  // const fullPath = `.${safePath}`;

  res.download(safePath, (err) => {
    if (err) {
      res.status(500).json({ msg: "Download failed" });
    }
  });
});

// get all courses
router.get("/course", async (req, res) => {
  try {
    const courses = await Course.find();

    res.json({
      total: courses.length,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to fetch courses",
      error: error.message,
    });
  }
});

// get a single course
router.get("/course/:courseId", async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ msg: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({
      msg: "Error fetching course",
      error: error.message,
    });
  }
});

// patch a course
router.patch("/course/:courseId", upload.single("thumbnail"), async (req, res) => {
  try {
    const updates = { ...req.body };

    // thumbnail
    if (req.file) {
      updates.thumbnail = `/uploads/${req.file.filename}`;
    }

    const updatedCourse = await Course.findByIdAndUpdate(req.params.courseId, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedCourse) {
      return res.status(404).json({ msg: "Course not found" });
    }

    res.json({
      msg: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to update course",
      error: error.message,
    });
  }
});

// delete a course
router.delete("/course/:courseId", async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.courseId);

    if (!deletedCourse) {
      return res.status(404).json({ msg: "Course not found" });
    }

    res.json({
      msg: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      msg: "Failed to delete course",
      error: error.message,
    });
  }
});

export default router;
