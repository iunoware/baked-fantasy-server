import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Category from "../models/category.js";

const router = express.Router();

// Multer config (single image)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Admin verification
async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1]?.trim();
    if (!token) return res.status(401).json({ msg: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "access denied" });
    }

    req.user = user; // ✅ attach user to req (not res)
    next();
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
}

// ---------------- CATEGORY ROUTES ----------------

// Create category (with 1 image)
router.post(
  "/categories",
  verifyAdmin,
  upload.single("image"), // 👈 expects form-data key: image
  async (req, res) => {
    try {
      const category = await Category.create({
        title: req.body.title,
        subject: req.body.subject || null,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null, // ✅ fixed field name
      });
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get single category new
router.get("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category by name
router.get("/categories/name/:title", async (req, res) => {
  // router.get("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findOne({ title: req.params.title });
    // const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.patch("/categories/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      // updateData.image = req.file.filename;
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category
router.delete("/categories/:id", verifyAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ msg: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
