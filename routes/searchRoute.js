import express from "express";
import Product from "../models/products.js";
import Essentials from "../models/essentials.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  const query = req.query.q;

  const products = await Product.find({
    title: { $regex: query, $options: "i" },
  });

  res.json(products);
});

export default router;
