import express from "express";
import multer from "multer";
import Product from "../models/products.js";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Category from "../models/category.js";

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

// async function verifyAdmin(req, res, next) {
//   try {
//     const token = req.headers.authorization?.split(" ")[1]?.trim();
//     if (!token) return res.status(401).json({ msg: "No token provided" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id);

//     if (!user || user.role !== "admin") {
//       return res.status(403).json({ msg: "access denied" });
//     }
//     res.user = user;
//     next();
//   } catch (error) {
//     res.status(400).json({ msg: "something went wrong", error: error.message });
//   }
// }

// CREATE product with category name + multiple images

router.post("/products", upload.array("images", 4), async (req, res) => {
  try {
    let { category } = req.body;

    // Find category by name
    if (!category) {
      // return res.status(404).json({ error: "Category not found" });
      return res.json([]);
    }

    const categoryBack = await Category.findOne({ title: category });
    if (!categoryBack) {
      return res.status(404).json({ error: "category not found" });
    }

    // Build image URLs
    const imageUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    const product = await Product.create({
      title: req.body.title,
      subject: req.body.subject,
      info: req.body.info,
      description: req.body.description,
      originalPrice: req.body.originalPrice,
      discountedPrice: req.body.discountedPrice,
      category: categoryBack._id,
      isActive: req.body.inStock,
      images: imageUrls,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET all products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().populate("category", "title");
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "title");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get related products
router.get("/products/:id/related", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "title");
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const related = await Product.find({
      category: product.category._id, // same category
      _id: { $ne: product._id }, // exclude the current product
    })
      .limit(3)
      .populate("category", "title");

    res.json(related);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET products by category name
router.get("/products/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;

    const category = await Category.findOne({ title: categoryName });
    if (!category) {
      // return res.status(404).json({ error: "No products found in this category" });
      return res.json([]);
    }

    const products = await Product.find({ category: category._id }).populate(
      "category",
      "title"
    );
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE product
router.patch("/products/:id", upload.array("images", 4), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // If files exist, handle them
    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("PATCH /products/:id error:", error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ msg: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
