import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Category from "../models/category.js"; // ✅ import category model
import Product from "../models/products.js"; // keep this for products

const router = express.Router();

// Configure multer storage
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
    res.user = user;
    next();
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
}

// ---------------- CATEGORY ROUTES ----------------

// Create category
router.post(
  "/categories",
  verifyAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      const category = await Category.create({
        title: req.body.title,
        subject: req.body.subject,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
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

// Get single category
router.get("/categories/name/:title", async (req, res) => {
  try {
    const category = await Category.findOne({ title: req.params.title });
    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put("/categories/:id", verifyAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
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
