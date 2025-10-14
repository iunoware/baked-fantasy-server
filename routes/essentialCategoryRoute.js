import express from "express";
import multer from "multer";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import EssCategory from "../models/essentialCategory.js";

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
  "/ess-categories",
  // verifyAdmin,
  upload.single("image"), // 👈 expects form-data key: image
  async (req, res) => {
    try {
      const essCategory = await EssCategory.create({
        title: req.body.title,
        subject: req.body.subject || null,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null, // ✅ fixed field name
      });
      res.status(201).json(essCategory);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get all categories
router.get("/ess-categories", async (req, res) => {
  try {
    const essCategories = await EssCategory.find();
    res.json(essCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category by name
router.get("/ess-categories/name/:title", async (req, res) => {
  try {
    const essCategories = await EssCategory.findOne({
      title: req.params.title,
    });
    if (!essCategories) return res.status(404).json({ error: "Category not found" });
    res.json(essCategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put("/ess-categories/:id", verifyAdmin, async (req, res) => {
  try {
    const essCategory = await EssCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!essCategory) return res.status(404).json({ error: "Category not found" });
    res.json(essCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category
router.delete("/ess-categories/:id", verifyAdmin, async (req, res) => {
  try {
    const essCategory = await EssCategory.findByIdAndDelete(req.params.id);
    if (!essCategory) return res.status(404).json({ error: "Category not found" });
    res.json({ msg: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
