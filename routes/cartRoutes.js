import express from "express";
import jwt from "jsonwebtoken";
import Cart from "../models/cart.js";
import User from "../models/user.js";

const router = express.Router();

async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1]?.trim();
    // console.log("Authorization header:", req.headers.authorization);
    // console.log("Token extracted:", token);

    if (!token) return res.status(401).json({ msg: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded ID:", decoded.id);

    const user = await User.findById(decoded.id);
    // console.log(user);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "access denied" });
    }
    res.user = user;
    next();
  } catch (error) {
    res.status(400).json({ msg: "something went wrong", error: error.message });
  }
}

// ✅ Add item to cart
router.post("/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ msg: "userId and productId are required" });
    }

    let cart = await Cart.findOne({ userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (i) => i.productId.toString() === productId
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }
      await cart.save();
    } else {
      cart = await Cart.create({ userId, items: [{ productId, quantity }] });
    }

    res.status(200).json({ message: "Added to cart", cart });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Get a user's cart
router.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart) return res.status(404).json({ msg: "Cart not found" });

    // 🧹 Remove invalid items (product deleted or not populated)
    cart.items = cart.items.filter((item) => item.productId !== null);

    // Optionally save if you want to permanently clean the DB
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Update quantity of a product in cart
router.put("/cart", async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ msg: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId
    );
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      res.json({ message: "Cart updated", cart });
    } else {
      res.status(404).json({ msg: "Product not found in cart" });
    }
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

// Remove a product from cart
router.delete("/cart", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    const cart = await Cart.findOne({ userId });

    if (!cart) return res.status(404).json({ msg: "Cart not found" });

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();
    res.json({ message: "Item removed", cart });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

export default router;
