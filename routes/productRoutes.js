import express from "express";
import Product from "../models/products.js"; // your schema

const router = express.Router();

// Add new product (CREATE)
router.post("/products", async (req, res) => {
  try {
    const product = await Product.create(req.body); // 👈 using create()
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all products (READ)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product by ID (READ)
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product by ID (UPDATE)
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product by ID (DELETE)
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
