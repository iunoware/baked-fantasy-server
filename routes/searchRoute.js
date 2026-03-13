import express from "express";
import Product from "../models/products.js";
import Essentials from "../models/essentials.js";

const router = express.Router();

router.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.json([]);
  }

  try {
    const [products, essentials] = await Promise.all([
      Product.find({
        title: { $regex: query, $options: "i" },
        isActive: true,
      }),
      Essentials.find({
        title: { $regex: query, $options: "i" },
        isActive: true,
      }),
    ]);

    const combinedResults = [...products, ...essentials];

    res.json(combinedResults);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
