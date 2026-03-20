import express from "express";
import authMiddleware from "../middleware/authmiddleware.js";
import Address from "../models/address";

const router = express.router();

router.post("/address", authMiddleware, async (req, res) => {
  try {
    const [label, fullAddress, landmark, lat, lng, isDefault] = req.body;

    if (isDefault) {
      await Address.updateMany(
        { userId: req.user.id },
        { $set: { isDefault: false } },
      );
    }

    const address = await Address.create({
      userId: req.user.id,
      label,
      fullAddress,
      lat,
      lng,
      landmark,
      isDefault,
    });

    res.status(200).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/address", authMiddleware, async (req, res) => {
  try {
    const address = (await Address.find({ userId: req.user.id })).sort({
      createdAt: -1,
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ message: "error.message" });
  }
});

export default router;
