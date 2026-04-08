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

// POST a course
router.post(
  "/course",
  authenticateToken,
  upload.single("thumbnail"),
  async (req, res) => {
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
  },
);

// POST sections
router.post("/course/:courseId/section", authenticateToken, async (req, res) => {
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
  authenticateToken,
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

// POST add a review
router.post("/course/:courseId/review", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const studentId = req.user.id;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ msg: "Course not found" });

    const alreadyReviewed = course.reviews.find(
      (r) => r.student.toString() === studentId,
    );
    if (alreadyReviewed)
      return res.status(400).json({ msg: "You have already reviewed this course" });

    course.reviews.push({ student: studentId, rating, comment: comment?.trim() || "" });
    course.ratingSum += rating;
    course.totalReviews += 1;
    course.rating = parseFloat((course.ratingSum / course.totalReviews).toFixed(1));

    await course.save();
    res.status(201).json({ msg: "Review added", course });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

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
    const course = await Course.findById(req.params.courseId).populate(
      "reviews.student",
      "name email",
    );

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

// old PATCH
// router.patch("/course/:courseId", upload.single("thumbnail"), async (req, res) => {
//   try {
//     const updates = { ...req.body };

//     // thumbnail
//     if (req.file) {
//       updates.thumbnail = `/uploads/${req.file.filename}`;
//     }

//     const updatedCourse = await Course.findByIdAndUpdate(req.params.courseId, updates, {
//       new: true,
//       runValidators: true,
//     });

//     if (!updatedCourse) {
//       return res.status(404).json({ msg: "Course not found" });
//     }

//     res.json({
//       msg: "Course updated successfully",
//       course: updatedCourse,
//     });
//   } catch (error) {
//     res.status(500).json({
//       msg: "Failed to update course",
//       error: error.message,
//     });
//   }
// });

// new PATCH for course (1st one)
router.patch(
  "/course/:courseId",
  authenticateToken,
  upload.single("thumbnail"),
  async (req, res) => {
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

      const updates = {};

      if (title) updates.title = title.trim();
      if (description) updates.description = description.trim();
      if (category) updates.category = category.trim();
      if (language) updates.language = language.trim();
      if (duration) updates.duration = duration.trim();
      if (originalPrice) updates.originalPrice = Number(originalPrice);
      if (discountedPrice) updates.discountedPrice = Number(discountedPrice);
      if (req.file) updates.thumbnail = `/uploads/${req.file.filename}`;

      const updatedCourse = await Course.findByIdAndUpdate(req.params.courseId, updates, {
        new: true,
        runValidators: true,
      });

      if (!updatedCourse) return res.status(404).json({ msg: "Course not found" });

      res.json({ msg: "Course updated successfully", course: updatedCourse });
    } catch (error) {
      res.status(500).json({ msg: "Failed to update course", error: error.message });
    }
  },
);

// new PATCH for section (2nd one)
router.patch(
  "/course/:courseId/section/:sectionId",
  authenticateToken,
  async (req, res) => {
    try {
      const { title, order } = req.body;
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const section = course.sections.id(req.params.sectionId);
      if (!section) return res.status(404).json({ msg: "Section not found" });

      if (title) section.title = title.trim();
      if (order !== undefined) section.order = order;

      await course.save();
      res.json({ msg: "Section updated", course });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
);

// new PATCH for lesson (3rd one)
router.patch(
  "/course/:courseId/section/:sectionId/lesson/:lessonId",
  authenticateToken,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, duration, order } = req.body;
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const section = course.sections.id(req.params.sectionId);
      if (!section) return res.status(404).json({ msg: "Section not found" });

      const lesson = section.lessons.id(req.params.lessonId);
      if (!lesson) return res.status(404).json({ msg: "Lesson not found" });

      if (title) lesson.title = title.trim();
      if (duration) lesson.duration = duration.trim();
      if (order !== undefined) lesson.order = Number(order);
      if (req.files?.video?.[0]) lesson.videoUrl = req.files.video[0].filename;
      if (req.files?.pdf?.[0]) lesson.pdfUrl = req.files.pdf[0].filename;
      if (req.body.removePdf === "true") lesson.pdfUrl = null;

      await course.save();
      res.json({ msg: "Lesson updated", course });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
);

// PATCH edit own review
router.patch(
  "/course/:courseId/review/:reviewId",
  authenticateToken,
  async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const studentId = req.user.id;

      if (rating && (rating < 1 || rating > 5))
        return res.status(400).json({ msg: "Rating must be between 1 and 5" });

      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const review = course.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ msg: "Review not found" });

      if (review.student.toString() !== studentId)
        return res.status(403).json({ msg: "Not your review" });

      if (rating) {
        course.ratingSum = course.ratingSum - review.rating + rating;
        course.rating = parseFloat((course.ratingSum / course.totalReviews).toFixed(1));
        review.rating = rating;
      }
      if (comment !== undefined) review.comment = comment.trim();

      await course.save();
      res.json({ msg: "Review updated", course });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
);

// delete a course
// router.delete("/course/:courseId", authenticateToken, async (req, res) => {
//   try {
//     const deletedCourse = await Course.findByIdAndDelete(req.params.courseId);

//     if (!deletedCourse) return res.status(404).json({ msg: "Course not found" });

//     res.json({ msg: "Course deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ msg: "Failed to delete course", error: error.message });
//   }
// });
router.delete("/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ msg: "Course not found" });

    // Delete all associated files
    const filesToDelete = [];

    if (course.thumbnail) filesToDelete.push(course.thumbnail.replace("/uploads/", ""));

    course.sections.forEach((section) => {
      section.lessons.forEach((lesson) => {
        if (lesson.videoUrl) filesToDelete.push(lesson.videoUrl);
        if (lesson.pdfUrl) filesToDelete.push(lesson.pdfUrl);
      });
    });

    filesToDelete.forEach((filename) => {
      const filePath = path.join(process.cwd(), "uploads", filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await Course.findByIdAndDelete(req.params.courseId);

    res.json({ msg: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Failed to delete course", error: error.message });
  }
});

// delete a section
router.delete(
  "/course/:courseId/section/:sectionId",
  authenticateToken,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const section = course.sections.id(req.params.sectionId);
      if (!section) return res.status(404).json({ msg: "Section not found" });

      section.deleteOne();
      await course.save();
      res.json({ msg: "Section deleted", course });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
);

// delete a lesson
router.delete(
  "/course/:courseId/section/:sectionId/lesson/:lessonId",
  authenticateToken,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const section = course.sections.id(req.params.sectionId);
      if (!section) return res.status(404).json({ msg: "Section not found" });

      const lesson = section.lessons.id(req.params.lessonId);
      if (!lesson) return res.status(404).json({ msg: "Lesson not found" });

      lesson.deleteOne();
      await course.save();
      res.json({ msg: "Lesson deleted", course });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },
);

// DELETE delete own review
router.delete(
  "/course/:courseId/review/:reviewId",
  authenticateToken,
  async (req, res) => {
    try {
      const studentId = req.user.id;

      const course = await Course.findById(req.params.courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const review = course.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ msg: "Review not found" });

      if (review.student.toString() !== studentId)
        return res.status(403).json({ msg: "Not your review" });

      course.ratingSum -= review.rating;
      course.totalReviews -= 1;
      course.rating =
        course.totalReviews > 0
          ? parseFloat((course.ratingSum / course.totalReviews).toFixed(1))
          : 0;

      review.deleteOne();
      await course.save();
      res.json({ msg: "Review deleted", course });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  },
);

export default router;
