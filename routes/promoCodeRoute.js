import express from "express";
import PromoCode from "../models/promoCode";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/promocode/", authMiddleware, async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.status(200).json(promos);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch promo codes" });
  }
});

router.post("/promocode", async (req, res) => {
  try {
    const { code, discount } = req.body;

    if (!code || !discount) {
      return res.status(400).json({ message: "Code and discount are required" });
    }

    const upperCode = code.toUpperCase().trim();

    if (upperCode.length < 6 || upperCode.length > 8) {
      return res.status(400).json({ message: "Code must be 6–8 characters" });
    }

    if (!/^[A-Z0-9]+$/.test(upperCode)) {
      return res
        .status(400)
        .json({ message: "Code must only contain letters and numbers" });
    }

    const existing = await PromoCode.findOne({ code: upperCode });
    if (existing) {
      return res.status(409).json({ message: "Promo code already exists" });
    }

    const promo = await PromoCode.create({ code: upperCode, discount });
    res.status(201).json(promo);
  } catch (err) {
    res.status(500).json({ message: "Failed to create promo code" });
  }
});

router.delete("/promocode/:id", async (req, res) => {
  try {
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Promo code not found" });
    }
    res.json({ message: "Promo code deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete promo code" });
  }
});

export default router;
