// this is the new courseRoute, the courseVideoRoutes.js is now useless

import express from "express";
import Course from "../models/course.js";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// post a course
router.post("/course", upload.single("thumbnail"), async (req, res) => {
  try {
    const { title, description, category, price, crossedPrice, language, duration } =
      req.body;

    if (!title || !description || !category || !price || !crossedPrice || !duration) {
      return res.status(400).json({
        msg: "Title, description, category, price, crossedPrice and duration are required",
      });
    }

    const priceNum = Number(price);
    const crossedPriceNum = Number(crossedPrice);

    if (isNaN(priceNum) || isNaN(crossedPriceNum)) {
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
      price: priceNum,
      crossedPrice: crossedPriceNum,
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

    if (!title || !order) {
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

      const course = await Course.findById(req.params.courseId);
      const section = course.sections.id(req.params.sectionId);

      section.lessons.push({
        title,
        duration,
        order,
        videoUrl: req.files?.video?.[0]
          ? `/uploads/${req.files.video[0].filename}`
          : null,
        pdfUrl: req.files?.pdf?.[0] ? `/uploads/${req.files.pdf[0].filename}` : null,
      });

      await course.save();

      res.json({ msg: "Lesson added successfully", course });
    } catch (error) {
      res.status(400).json({ msg: error.message });
    }
  },
);

// PDF download
router.get("/download", (req, res) => {
  const filePath = req.query.file;

  if (!filePath) {
    return res.status(400).json({ msg: "File path required" });
  }

  const fullPath = `.${filePath}`;

  res.download(fullPath, (err) => {
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
