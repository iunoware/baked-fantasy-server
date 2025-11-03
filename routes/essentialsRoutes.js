import express from "express";
import multer from "multer";
import Essentials from "../models/essentials.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import EssentialCategory from "../models/essentialCategory.js";

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

// accept multiple images
const upload = multer({ storage });

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

// CREATE product with category name + multiple images
router.post(
  "/bakingEssentials",
  // verifyAdmin,
  upload.array("images", 4),
  async (req, res) => {
    try {
      // Find category by name
      const category = await EssentialCategory.findOne({
        title: req.body.category,
      });
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Build image URLs
      const imageUrls = req.files
        ? req.files.map((file) => `/uploads/${file.filename}`)
        : [];

      const essential = await Essentials.create({
        title: req.body.title,
        subject: req.body.subject,
        info: req.body.info,
        description: req.body.description,
        originalPrice: req.body.originalPrice,
        discountedPrice: req.body.discountedPrice,
        category: category._id,
        inStock: req.body.inStock,
        images: imageUrls,
      });

      res.status(201).json(essential);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

// GET all Baking Essentials
router.get("/bakingEssentials", async (req, res) => {
  try {
    const essentials = await Essentials.find().populate("category", "title");
    res.json(essentials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product by ID
router.get("/bakingEssentials/:id", async (req, res) => {
  try {
    const essential = await Essentials.findById(req.params.id).populate(
      "category",
      "title"
    );
    if (!essential) return res.status(404).json({ error: "Product not found" });
    res.json(essential);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get related products
router.get("/essential/:id/related", async (req, res) => {
  try {
    const essential = await Essentials.findById(req.params.id).populate(
      "category",
      "title"
    );
    if (!essential) {
      return res.status(404).json({ error: "Product not found" });
    }

    const related = await Essentials.find({
      category: essential.category._id, // same category
      _id: { $ne: essential._id }, // exclude the current product
    })
      .limit(3)
      .populate("category", "title");

    res.json(related);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET products by category name
router.get("/essentials/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await EssentialCategory.findOne({ title: categoryName });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const essentials = await Essentials.find({
      category: category._id,
    }).populate("category", "title");
    res.json(essentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE product
router.put("/essentials/:id", verifyAdmin, async (req, res) => {
  try {
    const essential = await Essentials.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!essential) return res.status(404).json({ error: "Product not found" });
    res.json(essential);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE product
router.delete("/essentials/:id", verifyAdmin, async (req, res) => {
  try {
    const essential = await Essentials.findByIdAndDelete(req.params.id);
    if (!essential) return res.status(404).json({ error: "Product not found" });
    res.json({ msg: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
